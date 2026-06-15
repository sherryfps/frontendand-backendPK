package com.pkcorporate.repository;

import com.pkcorporate.entity.TShirtProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TShirtProductRepository extends JpaRepository<TShirtProduct, UUID> {
    Optional<TShirtProduct> findByProductCode(String productCode);

    @EntityGraph(attributePaths = {"images"})
    @Query("SELECT DISTINCT p FROM TShirtProduct p WHERE p.active = true")
    List<TShirtProduct> findByActiveTrue();

    @EntityGraph(attributePaths = {"images"})
    @Query("SELECT DISTINCT p FROM TShirtProduct p")
    List<TShirtProduct> findAllWithCollections();

    List<TShirtProduct> findByCategoryAndActiveTrue(String category);
    List<TShirtProduct> findByFabricTypeAndActiveTrue(String fabricType);

    @Query("SELECT p FROM TShirtProduct p WHERE p.active = true AND (" +
           "LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(p.fabricType) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<TShirtProduct> searchActive(@Param("q") String q, Pageable pageable);
}
