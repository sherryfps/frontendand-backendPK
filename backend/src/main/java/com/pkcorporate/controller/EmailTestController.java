package com.pkcorporate.controller;

import com.pkcorporate.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EmailTestController {

    private final EmailService emailService;

    /**
     * Simple endpoint to verify that SMTP settings are correct.
     * Example: GET /test/email?to=youremail@example.com
     */
    @GetMapping("/test/email")
    public String sendTestEmail(@RequestParam String to) {
        // Use a simple welcome email template for testing
        emailService.sendWelcomeEmail(to, "Test User", "tempPass123", "USER");
        return "Test email sent to " + to;
    }
}
