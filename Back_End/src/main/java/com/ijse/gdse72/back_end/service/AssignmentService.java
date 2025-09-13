package com.ijse.gdse72.back_end.service;

import com.ijse.gdse72.back_end.dto.AssignmentDTO;
import com.ijse.gdse72.back_end.entity.Assignment;

import java.util.List;

public interface AssignmentService {
    Assignment createAssignment(AssignmentDTO dto);
    List<Assignment> getAssignmentsByClass(Long classId);
}
