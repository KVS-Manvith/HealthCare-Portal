package com.manvith.healthcare_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.manvith.healthcare_backend.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    List<Appointment> findByDoctorId(Long doctorId);
}
