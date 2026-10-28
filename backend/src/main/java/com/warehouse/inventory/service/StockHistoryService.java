package com.warehouse.inventory.service;

import com.warehouse.inventory.dto.StockHistoryResponse;
import com.warehouse.inventory.entity.OperationType;
import com.warehouse.inventory.entity.Product;
import com.warehouse.inventory.entity.StockHistory;
import com.warehouse.inventory.repository.StockHistoryRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockHistoryService {

    static final int DEFAULT_LIMIT = 500;
    static final int MAX_LIMIT = 1000;

    private final StockHistoryRepository repository;

    public StockHistoryService(StockHistoryRepository repository) {
        this.repository = repository;
    }

    /**
     * MANDATORY: a history row can only be written inside the same transaction as the stock change,
     * so a failed operation can never leave a history record behind.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Product product, int previousQuantity, int newQuantity, OperationType type, String note) {
        repository.save(new StockHistory(product.getProductId(), product.getProductName(),
                previousQuantity, newQuantity, type, note));
    }

    @Transactional(readOnly = true)
    public List<StockHistoryResponse> list(String productId, Integer limit) {
        int size = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        PageRequest page = PageRequest.of(0, size);
        List<StockHistory> rows = (productId == null || productId.isBlank())
                ? repository.findAllByOrderByIdDesc(page)
                : repository.findByProductIdIgnoreCaseOrderByIdDesc(productId.trim(), page);
        return rows.stream().map(StockHistoryResponse::from).toList();
    }
}
