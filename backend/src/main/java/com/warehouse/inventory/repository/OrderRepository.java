package com.warehouse.inventory.repository;

import com.warehouse.inventory.entity.CustomerOrder;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = "items")
    List<CustomerOrder> findAllByOrderByIdDesc();
}
