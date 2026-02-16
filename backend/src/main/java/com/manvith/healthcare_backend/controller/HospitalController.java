package com.manvith.healthcare_backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manvith.healthcare_backend.model.Hospital;
import com.manvith.healthcare_backend.repository.HospitalRepository;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalRepository repo;

    public HospitalController(HospitalRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Hospital> getHospitals(@RequestParam(required = false) String q) {
        List<Hospital> all = repo.findAll();
        if (q == null || q.isBlank()) return all;

        String search = q.toLowerCase();
        return all.stream()
                .filter(h ->
                        (h.getName() != null && h.getName().toLowerCase().contains(search)) ||
                        (h.getAddress() != null && h.getAddress().toLowerCase().contains(search))
                )
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hospital> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody HospitalUpsertRequest hospital) {
        String validationError = validateHospital(hospital);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", validationError));
        }

        Hospital entity = new Hospital();
        entity.setName(hospital.name().trim());
        entity.setAddress(hospital.address().trim());
        entity.setPhone(hospital.phone().trim());
        entity.setLat(hospital.lat());
        entity.setLng(hospital.lng());

        return ResponseEntity.ok(repo.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HospitalUpsertRequest request) {
        String validationError = validateHospital(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", validationError));
        }

        Hospital existing = repo.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Hospital not found"));
        }

        existing.setName(request.name().trim());
        existing.setAddress(request.address().trim());
        existing.setPhone(request.phone().trim());
        existing.setLat(request.lat());
        existing.setLng(request.lng());
        return ResponseEntity.ok(repo.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Hospital existing = repo.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Hospital not found"));
        }

        repo.delete(existing);
        return ResponseEntity.ok(Map.of("message", "Hospital deleted"));
    }

    private String validateHospital(HospitalUpsertRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.address() == null || request.address().isBlank()
                || request.phone() == null || request.phone().isBlank()) {
            return "Name, address and phone are required";
        }
        if (request.lat() == null || request.lng() == null) {
            return "Latitude and longitude are required";
        }
        if (request.lat() < -90 || request.lat() > 90 || request.lng() < -180 || request.lng() > 180) {
            return "Latitude or longitude out of range";
        }
        return null;
    }

    public record HospitalUpsertRequest(
            String name,
            String address,
            String phone,
            Double lat,
            Double lng
    ) {}
}

