package com.pkcorporate.service;

import com.pkcorporate.dto.request.AdminProductCreateOrUpdateRequest;

import com.pkcorporate.dto.response.ProductImageResponse;
import com.pkcorporate.dto.response.ProductResponse;
import com.pkcorporate.entity.ProductImage;
import com.pkcorporate.entity.TShirtProduct;
import com.pkcorporate.exception.BusinessException;
import com.pkcorporate.repository.TShirtProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final TShirtProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public ProductResponse createProduct(AdminProductCreateOrUpdateRequest req, List<MultipartFile> images, Integer primaryImageIndex) {
        if (req.discountPrice() != null && req.discountPrice().compareTo(req.basePrice()) > 0) {
            throw new BusinessException("discountPrice cannot be greater than basePrice");
        }

        TShirtProduct product = TShirtProduct.builder()
                .productCode(req.productCode())
                .name(req.name())
                .description(req.description())
                .category(req.category())
                .fabricType(req.fabricType())
                .gsm(req.gsm())
                .neckType(req.neckType())
                .sleeveType(req.sleeveType())
                .minimumOrderQuantity(req.minimumOrderQuantity() != null ? req.minimumOrderQuantity() : 10)
                .basePrice(req.basePrice())
                .discountPrice(req.discountPrice())
                .stockQuantity(req.stockQuantity())
                .brand(req.brand())
                .availableSizes(new ArrayList<>(req.availableSizes()))
                .availableColors(new ArrayList<>(req.availableColors()))
                .printTypes(new ArrayList<>(req.printTypes()))
                .active(req.active() != null ? req.active() : true)
                .build();

        // Persist first to get FK for images
        product = productRepository.save(product);

        if (images != null && !images.isEmpty()) {
            List<ProductImage> saved = saveImages(product, images, primaryImageIndex);
            product.setImages(saved);
            product = productRepository.save(product);
        }

        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, AdminProductCreateOrUpdateRequest req, List<MultipartFile> images, Integer primaryImageIndex) {
        TShirtProduct product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Product not found"));

        if (req.discountPrice() != null && req.discountPrice().compareTo(req.basePrice()) > 0) {
            throw new BusinessException("discountPrice cannot be greater than basePrice");
        }

        // Update fields
        product.setProductCode(req.productCode());
        product.setName(req.name());
        product.setDescription(req.description());
        product.setCategory(req.category());
        product.setFabricType(req.fabricType());
        product.setGsm(req.gsm());
        product.setNeckType(req.neckType());
        product.setSleeveType(req.sleeveType());
        product.setMinimumOrderQuantity(req.minimumOrderQuantity() != null ? req.minimumOrderQuantity() : product.getMinimumOrderQuantity());
        product.setBasePrice(req.basePrice());
        product.setDiscountPrice(req.discountPrice());
        product.setStockQuantity(req.stockQuantity());
        product.setBrand(req.brand());

        product.setAvailableSizes(new ArrayList<>(req.availableSizes()));
        product.setAvailableColors(new ArrayList<>(req.availableColors()));
        product.setPrintTypes(new ArrayList<>(req.printTypes()));
        if (req.active() != null) product.setActive(req.active());

        // Image handling: if images provided, replace all
        if (images != null && !images.isEmpty()) {
            // delete old cloudinary images if publicId exists
            if (product.getImages() != null) {
                for (ProductImage img : product.getImages()) {
                    if (img.getCloudinaryPublicId() != null) {
                        cloudinaryService.deleteFile(img.getCloudinaryPublicId());
                    }
                }
            }

            product.getImages().clear();
            List<ProductImage> saved = saveImages(product, images, primaryImageIndex);
            product.setImages(saved);
        }

        product = productRepository.save(product);
        return toResponse(product);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        TShirtProduct product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Product not found"));

        // delete images
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                if (img.getCloudinaryPublicId() != null) {
                    cloudinaryService.deleteFile(img.getCloudinaryPublicId());
                }
            }
        }

        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse setActive(UUID id, boolean active) {
        TShirtProduct product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Product not found"));
        product.setActive(active);
        product = productRepository.save(product);
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProducts() {
        return productRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // ─── Internals ─────────────────────────────────────────────

    private List<ProductImage> saveImages(TShirtProduct product, List<MultipartFile> images, Integer primaryImageIndex) {
        int max = 8;
        List<MultipartFile> safe = images.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (safe.size() > max) {
            throw new BusinessException("You can upload up to " + max + " images per product");
        }

        List<ProductImage> saved = new ArrayList<>();
        for (int i = 0; i < safe.size(); i++) {
            MultipartFile file = safe.get(i);
            if (file.isEmpty()) continue;

            // Validate MIME type, extension and file size
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new BusinessException("Only image files are allowed");
            }
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
                if (!List.of("jpg", "jpeg", "png", "webp", "gif").contains(ext)) {
                    throw new BusinessException("Invalid image file extension: " + ext);
                }
            }
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new BusinessException("Image file size exceeds limit of 10MB");
            }

            try {
                Map<String, String> up = cloudinaryService.uploadImage(file, "products");
                boolean isPrimary = primaryImageIndex != null ? i == primaryImageIndex : i == 0;

                ProductImage pi = ProductImage.builder()
                        .product(product)
                        .imageUrl(up.get("url"))
                        .cloudinaryPublicId(up.get("publicId"))
                        .isPrimary(isPrimary)
                        .sortOrder(i)
                        .build();

                saved.add(pi);
            } catch (IOException e) {
                log.error("Image upload failed", e);
                throw new BusinessException("Image upload failed: " + e.getMessage());
            }
        }
        return saved;
    }

    private ProductResponse toResponse(TShirtProduct p) {
        BigDecimal effective = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getBasePrice();

        List<ProductImageResponse> imgs = p.getImages() == null ? List.of() : p.getImages().stream()
                .map(img -> new ProductImageResponse(
                        img.getId(),
                        img.getImageUrl(),
                        img.getCloudinaryPublicId(),
                        img.isPrimary(),
                        img.getSortOrder(),
                        img.getColorHex(),
                        img.getCreatedAt()
                ))
                .sorted(Comparator.comparing(ProductImageResponse::sortOrder, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        return new ProductResponse(
                p.getId(),
                p.getProductCode(),
                p.getName(),
                p.getDescription(),
                p.getBrand(),
                p.getCategory(),
                p.getFabricType(),
                p.getGsm(),
                p.getNeckType(),
                p.getSleeveType(),
                p.getMinimumOrderQuantity(),
                p.getBasePrice(),
                p.getDiscountPrice(),
                effective,
                p.isActive(),
                p.getStockQuantity(),
                p.getAvailableSizes() == null ? List.of() : p.getAvailableSizes(),
                // backend stores colors as hex strings
                p.getAvailableColors() == null ? List.of() : p.getAvailableColors(),
                p.getPrintTypes() == null ? List.of() : p.getPrintTypes(),
                imgs
        );
    }
}

