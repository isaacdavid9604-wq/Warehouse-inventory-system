package com.warehouse.inventory.repository;

import com.warehouse.inventory.entity.Product;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    boolean existsByProductIdIgnoreCase(String productId);

    Optional<Product> findByProductIdIgnoreCase(String productId);

    /** SELECT ... FOR UPDATE: serialises every writer of the same product row. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where lower(p.productId) = lower(:productId)")
    Optional<Product> findForUpdate(@Param("productId") String productId);

    List<Product> findAllByOrderByProductIdAsc();

    @Query("""
            select p from Product p
            where lower(p.productId) like concat('%', :term, '%')
               or lower(p.productName) like concat('%', :term, '%')
            order by p.productId
            """)
    List<Product> search(@Param("term") String lowerCaseTerm);

    @Query("select coalesce(sum(p.stockQuantity), 0) from Product p")
    long sumStockUnits();

    long countByStockQuantity(int stockQuantity);

    @Query("select count(p) from Product p where p.stockQuantity > 0 and p.stockQuantity < :threshold")
    long countLowStock(@Param("threshold") int threshold);
}
