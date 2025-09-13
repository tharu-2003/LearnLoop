package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.AssignmentDTO;
import com.ijse.gdse72.back_end.entity.Assignment;
import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.repository.AssignmentRepository;
import com.ijse.gdse72.back_end.repository.ClassRepository;
import com.ijse.gdse72.back_end.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ClassRepository classRepository;

    @Override
    public Assignment createAssignment(AssignmentDTO dto) {
        Class classEntity = classRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Assignment assignment = Assignment.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .endDate(LocalDateTime.parse(dto.getEndDate()))
                .points(dto.getPoints())
                .documentUrl(dto.getDocumentUrl()) // single file
                .classEntity(classEntity)
                .build();

        return assignmentRepository.save(assignment);
    }

    @Override
    public List<Assignment> getAssignmentsByClass(Long classId) {
        return assignmentRepository.findByClassEntity_ClassId(classId);
    }
}
