package com.example.car_rental_service.service;

import com.example.car_rental_service.model.entity.Report;

import java.util.List;
import java.util.Map;

public interface ReportService {

    List<Report> getAllReports(String status, String type);

    Report getReport(Long id);

    Report createReport(Report report);

    Report updateReport(Long id, Report report);

    void deleteReport(Long id);

    Map<String, Object> getAnalyticsSummary();
}