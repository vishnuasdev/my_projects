package com.example.car_rental_service.repository;

import com.example.car_rental_service.model.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatusIgnoreCase(String status);

    List<Report> findByTypeIgnoreCase(String type);

    List<Report> findByStatusIgnoreCaseAndTypeIgnoreCase(String status, String type);
}