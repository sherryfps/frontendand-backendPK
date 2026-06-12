package com.pkcorporate.controller;

import com.pkcorporate.dto.request.AdminProductCreateOrUpdateRequest;
import com.pkcorporate.dto.response.ApiResponse;
import com.pkcorporate.dto.response.ProductResponse;
import com.pkcorporate.service.ProductService;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/admin/products")
@RequiredArgsConstructor
@Tag(name = "Admin Products", description = "Admin CRUD for catalog products")
public class AdminProductController {

    private final ProductService productService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Operation(summary = "Get all products (active + inactive) for admin management")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(productService.getAllProducts()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a new product with multiple images")
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestPart("data") AdminProductCreateOrUpdateRequest data,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "primaryImageIndex", required = false) Integer primaryImageIndex
    ) {
        ProductResponse created = productService.createProduct(data, images, primaryImageIndex);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update an existing product; optionally replace/add images")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestPart("data") AdminProductCreateOrUpdateRequest data,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "primaryImageIndex", required = false) Integer primaryImageIndex
    ) {
        ProductResponse updated = productService.updateProduct(id, data, images, primaryImageIndex);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/enable")
    @Operation(summary = "Enable a product")
    public ResponseEntity<ApiResponse<ProductResponse>> enable(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productService.setActive(id, true)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/disable")
    @Operation(summary = "Disable a product")
    public ResponseEntity<ApiResponse<ProductResponse>> disable(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productService.setActive(id, false)));
    }
}

