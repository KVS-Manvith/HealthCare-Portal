package com.manvith.healthcare_backend.repository;



import org.springframework.data.jpa.repository.JpaRepository;

import com.manvith.healthcare_backend.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {}
