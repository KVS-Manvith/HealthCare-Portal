package com.manvith.healthcare_backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manvith.healthcare_backend.model.Doctor;
import com.manvith.healthcare_backend.repository.AppointmentRepository;
import com.manvith.healthcare_backend.repository.DoctorRepository;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorRepository repo;
    private final AppointmentRepository appointmentRepository;

    public DoctorController(DoctorRepository repo, AppointmentRepository appointmentRepository) {
        this.repo = repo;
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping
    public List<Doctor> getDoctors() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createDoctor(@RequestBody CreateDoctorRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor name is required"));
        }
        if (request.rating() != null && (request.rating() < 0 || request.rating() > 5)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 0 and 5"));
        }

        Doctor doctor = new Doctor();
        doctor.setName(request.name().trim());
        doctor.setSpecialty(normalizedSpecialty(request.specialty()));
        doctor.setRating(request.rating() == null ? 0.0 : request.rating());
        return ResponseEntity.ok(repo.save(doctor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody CreateDoctorRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor name is required"));
        }
        if (request.rating() != null && (request.rating() < 0 || request.rating() > 5)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 0 and 5"));
        }

        Optional<Doctor> existing = repo.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Doctor not found"));
        }

        Doctor doctor = existing.get();
        doctor.setName(request.name().trim());
        doctor.setSpecialty(normalizedSpecialty(request.specialty()));
        doctor.setRating(request.rating() == null ? 0.0 : request.rating());
        return ResponseEntity.ok(repo.save(doctor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        Optional<Doctor> existing = repo.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Doctor not found"));
        }
        if (!appointmentRepository.findByDoctorId(id).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor has appointments and cannot be deleted"));
        }

        repo.delete(existing.get());
        return ResponseEntity.ok(Map.of("message", "Doctor deleted"));
    }

    private String normalizedSpecialty(String specialty) {
        if (specialty == null || specialty.isBlank()) {
            return "General Medicine";
        }
        return specialty.trim();
    }

    public record CreateDoctorRequest(
            String name,
            String specialty,
            Double rating
    ) {}
}
