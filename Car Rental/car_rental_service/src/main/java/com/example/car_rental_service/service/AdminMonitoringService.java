package com.example.car_rental_service.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class AdminMonitoringService {
    private static final int MAX_EVENTS = 500;
    private final Deque<Map<String, Object>> events = new ConcurrentLinkedDeque<>();

    public void record(String type, String message, String severity) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", Instant.now().toEpochMilli() + "-" + events.size());
        event.put("type", type);
        event.put("message", message);
        event.put("severity", severity);
        event.put("createdAt", Instant.now().toString());
        events.addFirst(event);
        while (events.size() > MAX_EVENTS) {
            events.pollLast();
        }
    }

    public List<Map<String, Object>> recent(int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 100));
        return new ArrayList<>(events).subList(0, Math.min(boundedLimit, events.size()));
    }

    public List<Map<String, Object>> recentLogs(int limit) {
        return recent(limit);
    }
}
