package com.manvith.healthcare_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.manvith.healthcare_backend.model.Hospital;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {}
