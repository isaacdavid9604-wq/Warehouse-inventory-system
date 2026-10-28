package com.warehouse.inventory.controller;

import com.warehouse.inventory.dto.DashboardSummaryResponse;
import com.warehouse.inventory.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /** threshold is optional; the frontend sends its own low-stock threshold. */
    @GetMapping("/summary")
    public DashboardSummaryResponse summary(@RequestParam(required = false) Integer threshold) {
        return dashboardService.summary(threshold);
    }
}
