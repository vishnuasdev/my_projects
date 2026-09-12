package com.example.car_rental_service.service.impl;

import com.example.car_rental_service.model.entity.Booking;
import com.example.car_rental_service.model.entity.Car;
import com.example.car_rental_service.model.entity.Report;
import com.example.car_rental_service.model.enums.BidStatus;
import com.example.car_rental_service.model.enums.BookingStatus;
import com.example.car_rental_service.repository.BookingRepository;
import com.example.car_rental_service.repository.CarRepository;
import com.example.car_rental_service.repository.ReportRepository;
import com.example.car_rental_service.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;

    public ReportServiceImpl(ReportRepository reportRepository,
                             BookingRepository bookingRepository,
                             CarRepository carRepository) {
        this.reportRepository = reportRepository;
        this.bookingRepository = bookingRepository;
        this.carRepository = carRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Report> getAllReports(String status, String type) {
        boolean hasStatus = status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status);
        boolean hasType = type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type);

        if (hasStatus && hasType) {
            return reportRepository.findByStatusIgnoreCaseAndTypeIgnoreCase(status, type);
        }
        if (hasStatus) {
            return reportRepository.findByStatusIgnoreCase(status);
        }
        if (hasType) {
            return reportRepository.findByTypeIgnoreCase(type);
        }
        return reportRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Report getReport(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    @Override
    @Transactional
    public Report createReport(Report report) {
        report.setId(null);
        return reportRepository.save(report);
    }

    @Override
    @Transactional
    public Report updateReport(Long id, Report report) {
        Report existing = getReport(id);
        existing.setTitle(report.getTitle());
        existing.setType(report.getType());
        existing.setPeriod(report.getPeriod());
        existing.setDescription(report.getDescription());
        existing.setStartDate(report.getStartDate());
        existing.setEndDate(report.getEndDate());
        existing.setStatus(report.getStatus());
        return reportRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
        }
        reportRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsSummary() {
        List<Booking> bookings = bookingRepository.findAll();
        List<Car> cars = carRepository.findAll();

        double totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .map(Booking::getTotalCost)
                .filter(v -> v != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        long activeFleet = cars.stream()
                .filter(c -> c.isAvailable() && c.getBidStatus() == BidStatus.ACCEPTED)
                .count();

        Map<String, Long> bookingStats = new HashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            long count = bookings.stream().filter(b -> b.getStatus() == status).count();
            if (count > 0) {
                bookingStats.put(status.name(), count);
            }
        }

        Map<String, Double> revenueTrendMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM-yyyy");
        for (Booking b : bookings) {
            if (b.getStatus() != BookingStatus.CONFIRMED && b.getStatus() != BookingStatus.COMPLETED) {
                continue;
            }
            if (b.getStartDate() == null || b.getTotalCost() == null) {
                continue;
            }
            String month = YearMonth.from(b.getStartDate()).format(formatter);
            revenueTrendMap.merge(month, b.getTotalCost(), Double::sum);
        }

        List<Map<String, Object>> revenueTrend = revenueTrendMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("month", e.getKey());
                    item.put("revenue", e.getValue());
                    return item;
                })
                .toList();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalReports", reportRepository.count());
        summary.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        summary.put("totalBookings", bookings.size());
        summary.put("activeFleet", activeFleet);
        summary.put("bookingStats", bookingStats);
        summary.put("revenueTrend", revenueTrend);
        summary.put("summary", "Dashboard reflects live data derived from bookings, fleet and users.");
        return summary;
    }
}