package com.warehouse.inventory.repository;

import com.warehouse.inventory.entity.StockHistory;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHistoryRepository extends JpaRepository<StockHistory, Long> {

    List<StockHistory> findAllByOrderByIdDesc(Pageable pageable);

    List<StockHistory> findByProductIdIgnoreCaseOrderByIdDesc(String productId, Pageable pageable);
}
