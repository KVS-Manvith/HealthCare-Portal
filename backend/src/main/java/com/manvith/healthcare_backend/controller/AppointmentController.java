package com.manvith.healthcare_backend.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manvith.healthcare_backend.model.Appointment;
import com.manvith.healthcare_backend.repository.AppointmentRepository;
import com.manvith.healthcare_backend.repository.DoctorRepository;
import com.manvith.healthcare_backend.repository.UserRepository;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository repo;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentController(
            AppointmentRepository repo,
            UserRepository userRepository,
            DoctorRepository doctorRepository
    ) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AppointmentRequest request, Authentication authentication) {
        if (request.userId() == null || request.doctorId() == null || request.date() == null || request.time() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId, doctorId, date and time are required"));
        }
        if (!isAdmin(authentication) && !request.userId().equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        if (request.date().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Appointment date cannot be in the past"));
        }
        if (request.date().isEqual(LocalDate.now()) && request.time().isBefore(LocalTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Appointment time cannot be in the past"));
        }
        if (request.reason() == null || request.reason().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reason is required"));
        }
        if (userRepository.findById(request.userId()).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User does not exist"));
        }
        if (doctorRepository.findById(request.doctorId()).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor does not exist"));
        }

        Appointment a = new Appointment();
        a.setUserId(request.userId());
        a.setDoctorId(request.doctorId());
        a.setDate(request.date());
        a.setTime(request.time());
        a.setReason(request.reason() == null ? "" : request.reason().trim());
        a.setStatus("PENDING");

        return ResponseEntity.ok(repo.save(a));
    }

    @GetMapping
    public ResponseEntity<?> byUserQuery(@RequestParam(required = false) Long userId, Authentication authentication) {
        if (userId == null) {
            if (!isAdmin(authentication)) {
                return ResponseEntity.ok(repo.findByUserId(currentUserId(authentication)));
            }
            return ResponseEntity.ok(repo.findAll());
        }
        if (!isAdmin(authentication) && !userId.equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        return ResponseEntity.ok(repo.findByUserId(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> byUser(@PathVariable Long userId, Authentication authentication) {
        if (!isAdmin(authentication) && !userId.equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        return ResponseEntity.ok(repo.findByUserId(userId));
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<?> cancel(@PathVariable Long appointmentId, Authentication authentication) {
        Optional<Appointment> existingOpt = repo.findById(appointmentId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Appointment not found"));
        }

        Appointment existing = existingOpt.get();
        if (!isAdmin(authentication) && !existing.getUserId().equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        existing.setStatus("CANCELLED");
        return ResponseEntity.ok(repo.save(existing));
    }

    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long appointmentId,
            @RequestBody AppointmentStatusRequest request,
            Authentication authentication
    ) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        if (request.status() == null || request.status().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        String nextStatus = request.status().trim().toUpperCase();
        if (!"PENDING".equals(nextStatus) && !"CONFIRMED".equals(nextStatus) && !"CANCELLED".equals(nextStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
        }

        Optional<Appointment> existingOpt = repo.findById(appointmentId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Appointment not found"));
        }

        Appointment existing = existingOpt.get();
        existing.setStatus(nextStatus);
        return ResponseEntity.ok(repo.save(existing));
    }

    private Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getPrincipal().toString());
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    public record AppointmentRequest(
            Long userId,
            Long doctorId,
            LocalDate date,
            LocalTime time,
            String reason
    ) {}

    public record AppointmentStatusRequest(String status) {}
}
