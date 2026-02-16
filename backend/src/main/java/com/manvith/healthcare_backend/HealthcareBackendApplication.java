package com.manvith.healthcare_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.manvith.healthcare_backend")
public class HealthcareBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(HealthcareBackendApplication.class, args);
    }
}
