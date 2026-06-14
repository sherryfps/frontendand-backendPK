package com.pkcorporate.controller;

import com.pkcorporate.dto.response.ApiResponse;
import com.pkcorporate.entity.Order;
import com.pkcorporate.entity.Payment;
import com.pkcorporate.enums.OrderStatus;
import com.pkcorporate.enums.PaymentStatus;
import com.pkcorporate.repository.OrderRepository;
import com.pkcorporate.repository.PaymentRepository;
import com.pkcorporate.service.EmailService;
import com.pkcorporate.service.NotificationService;
import com.razorpay.RazorpayClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Razorpay checkout and verification API endpoints")
public class PaymentController {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @PostMapping("/create-order")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT', 'ACCOUNTANT')")
    @Operation(summary = "Create Razorpay checkout order transaction")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, String> request) {
        String orderIdStr = request.get("orderId");
        String paymentType = request.get("paymentType"); // "ADVANCE" or "BALANCE"

        if (orderIdStr == null || paymentType == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing orderId or paymentType"));
        }

        try {
            UUID orderId = UUID.fromString(orderIdStr);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

            BigDecimal amountInRupees;
            if ("ADVANCE".equalsIgnoreCase(paymentType)) {
                amountInRupees = order.getAdvanceAmount();
            } else if ("BALANCE".equalsIgnoreCase(paymentType)) {
                amountInRupees = order.getBalanceAmount();
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid paymentType: must be ADVANCE or BALANCE"));
            }

            if (amountInRupees == null || amountInRupees.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or empty amount configured for order"));
            }

            // Convert to paise (1 INR = 100 paise)
            int amountInPaise = amountInRupees.multiply(new BigDecimal(100)).intValue();
            if (amountInPaise < 100) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Minimum transaction amount must be at least 100 paise (1 INR)"));
            }

            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", order.getOrderNumber() + "_" + paymentType.toLowerCase());

            com.razorpay.Order razorpayOrder = razorpay.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            order.setRazorpayOrderId(razorpayOrderId);
            orderRepository.save(order);

            log.info("Successfully created Razorpay Order {} for ERP Order {}", razorpayOrderId, order.getOrderNumber());

            return ResponseEntity.ok(ApiResponse.success("Checkout order created", Map.of(
                    "razorpayOrderId", razorpayOrderId,
                    "amount", amountInPaise,
                    "currency", "INR",
                    "orderNumber", order.getOrderNumber(),
                    "keyId", keyId
            )));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to generate Razorpay transaction order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Razorpay order generation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Verify Razorpay payment signature and record invoice status")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        String razorpayOrderId = request.get("razorpayOrderId");
        String razorpayPaymentId = request.get("razorpayPaymentId");
        String razorpaySignature = request.get("razorpaySignature");
        String orderIdStr = request.get("orderId");
        String paymentType = request.get("paymentType"); // "ADVANCE" or "BALANCE"

        if (razorpayOrderId == null || razorpayPaymentId == null ||
            razorpaySignature == null || orderIdStr == null || paymentType == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing required verification fields"));
        }

        // 1. Signature check
        boolean signatureValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!signatureValid) {
            log.warn("Razorpay payment signature mismatch for order: {}", razorpayOrderId);
            return ResponseEntity.badRequest().body(ApiResponse.error("Signature verification failed. Untrusted request."));
        }

        try {
            UUID orderId = UUID.fromString(orderIdStr);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

            // 2. Set amounts and statuses based on type
            BigDecimal transactionAmount;
            if ("ADVANCE".equalsIgnoreCase(paymentType)) {
                transactionAmount = order.getAdvanceAmount();
                order.setPaymentStatus(PaymentStatus.ADVANCE_PAID);
                order.setStatus(OrderStatus.PAYMENT_VERIFIED);
                order.setPaidAmount(transactionAmount);
            } else {
                transactionAmount = order.getBalanceAmount();
                order.setPaymentStatus(PaymentStatus.FULLY_PAID);
                order.setStatus(OrderStatus.COMPLETED);
                order.setPaidAmount(order.getTotalAmount());
            }

            // 3. Build and save the verified payment entity
            Payment payment = Payment.builder()
                    .order(order)
                    .paymentType(paymentType.toUpperCase())
                    .amount(transactionAmount)
                    .paymentMethod("RAZORPAY")
                    .razorpayPaymentId(razorpayPaymentId)
                    .razorpayOrderId(razorpayOrderId)
                    .razorpaySignature(razorpaySignature)
                    .verified(true)
                    .verifiedAt(LocalDateTime.now())
                    .notes("Online payment verified successfully via Razorpay Web Checkout.")
                    .build();

            paymentRepository.save(payment);
            order.getPayments().add(payment);
            orderRepository.save(order);

            log.info("Payment verified successfully. ERP Order: {}, Payment: {}", order.getOrderNumber(), razorpayPaymentId);

            // 4. Trigger system notifications and email receipts
            notificationService.notifyPaymentVerified(order);

            try {
                emailService.sendPaymentConfirmation(
                        order.getCustomer().getEmail(),
                        order.getCustomer().getName(),
                        order.getOrderNumber(),
                        transactionAmount.toString()
                );
            } catch (Exception ex) {
                log.error("SMTP failure sending payment confirmation for order: {}", order.getOrderNumber(), ex);
            }

            return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", Map.of(
                    "paymentId", payment.getId().toString(),
                    "orderStatus", order.getStatus().name(),
                    "paymentStatus", order.getPaymentStatus().name()
            )));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to commit verified payment transaction", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to save transaction: " + e.getMessage()));
        }
    }

    private boolean verifySignature(String orderId, String paymentId, String razorpaySignature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac sha256HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(keySecret.getBytes("UTF-8"), "HmacSHA256");
            sha256HMAC.init(secretKey);
            byte[] rawHmac = sha256HMAC.doFinal(payload.getBytes("UTF-8"));
            String computedSignature = byteToHex(rawHmac);
            return computedSignature.equals(razorpaySignature);
        } catch (Exception e) {
            log.error("Error computing signature hash verification", e);
            return false;
        }
    }

    private String byteToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
