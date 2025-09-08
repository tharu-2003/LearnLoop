package com.ijse.gdse72.back_end.service;

import com.ijse.gdse72.back_end.dto.ClassResponseDTO;
import com.ijse.gdse72.back_end.dto.CreateClassDTO;
import com.ijse.gdse72.back_end.entity.Priority;

import java.util.List;
import java.util.Map;

public interface ClassService {

    // Create a new class (imageUrl included in DTO)
    ClassResponseDTO createClass(CreateClassDTO createClassDTO);

    List<ClassResponseDTO> getClassesByTeacher(Long teacherId);

    ClassResponseDTO getClassById(Long classId);

    // Update class (imageUrl may be present in DTO)
    ClassResponseDTO updateClass(Long classId, CreateClassDTO updateDTO);

    void deleteClass(Long classId);

    List<ClassResponseDTO> getClassesByPriority(Priority priority);

    Map<String, Long> getTeacherClassStatistics(Long teacherId);

    boolean isPasscodeUnique(String passcode);

    List<ClassResponseDTO> getClassesByStudent(Long studentId);

}
