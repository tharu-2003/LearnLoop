package com.ijse.gdse72.back_end.repository;

import com.ijse.gdse72.back_end.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClassEntity_ClassId(Long classId);
}
