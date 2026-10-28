package com.warehouse.inventory.controller;

import com.warehouse.inventory.dto.StockHistoryResponse;
import com.warehouse.inventory.service.StockHistoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stock-history")
@Tag(name = "Stock history")
public class StockHistoryController {

    private final StockHistoryService stockHistoryService;

    public StockHistoryController(StockHistoryService stockHistoryService) {
        this.stockHistoryService = stockHistoryService;
    }

    @GetMapping
    public List<StockHistoryResponse> list(@RequestParam(required = false) String productId,
                                           @RequestParam(required = false) Integer limit) {
        return stockHistoryService.list(productId, limit);
    }
}
