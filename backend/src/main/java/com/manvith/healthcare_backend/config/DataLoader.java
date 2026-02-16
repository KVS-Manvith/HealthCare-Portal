package com.manvith.healthcare_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.manvith.healthcare_backend.model.Doctor;
import com.manvith.healthcare_backend.model.Hospital;
import com.manvith.healthcare_backend.model.User;
import com.manvith.healthcare_backend.repository.DoctorRepository;
import com.manvith.healthcare_backend.repository.HospitalRepository;
import com.manvith.healthcare_backend.repository.UserRepository;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadData(
            DoctorRepository doctorRepo,
            HospitalRepository hospitalRepo,
            UserRepository userRepo,
            PasswordEncoder passwordEncoder) {

        return args -> {

            if (doctorRepo.count() == 0) {
                doctorRepo.save(new Doctor(null, "Dr. Kavya Reddy", "Pediatrics", 4.6));
                doctorRepo.save(new Doctor(null, "Dr. Arjun Chowdary", "Orthopedics", 4.4));
                doctorRepo.save(new Doctor(null, "Dr. Meera Sharma", "Dermatology", 4.7));
            }

            if (hospitalRepo.count() == 0) {
                hospitalRepo.save(new Hospital(
                        null,
                        "Metro Health Center",
                        "Hyderabad",
                        "+91-9876543210",
                        17.445,
                        78.349
                ));

                hospitalRepo.save(new Hospital(
                        null,
                        "City Care Hospital",
                        "Hyderabad",
                        "+91-8888888888",
                        17.450,
                        78.351
                ));
            }

            if (userRepo.count() == 0) {
                User demo = new User();
                demo.setFullName("Demo Patient");
                demo.setEmail("demo@healthcare.local");
                demo.setPassword(passwordEncoder.encode("demo123"));
                demo.setPhone("+1-555-0101");
                demo.setRole("PATIENT");
                userRepo.save(demo);

                User admin = new User();
                admin.setFullName("Admin User");
                admin.setEmail("admin@healthcare.local");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                userRepo.save(admin);
            }
        };
    }
}
