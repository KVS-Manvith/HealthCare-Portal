package com.manvith.healthcare_backend.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manvith.healthcare_backend.model.User;
import com.manvith.healthcare_backend.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication) && !id.equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        return userRepo.findById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(toResponse(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody UpdateUserRequest request, Authentication authentication) {
        if (!isAdmin(authentication) && !id.equals(currentUserId(authentication))) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        User user = userRepo.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        user.setDob(request.dob());
        user.setPhone(request.phone());

        User saved = userRepo.save(user);
        return ResponseEntity.ok(toResponse(saved));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getDob(),
                user.getPhone(),
                user.getRole()
        );
    }

    private Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getPrincipal().toString());
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    public record UpdateUserRequest(
            String fullName,
            LocalDate dob,
            String phone
    ) {}

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            LocalDate dob,
            String phone,
            String role
    ) {}
}
