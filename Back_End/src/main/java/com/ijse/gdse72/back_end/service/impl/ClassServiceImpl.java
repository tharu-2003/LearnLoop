package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.ClassResponseDTO;
import com.ijse.gdse72.back_end.dto.CreateClassDTO;
import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.entity.Status;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.ClassRepository;
import com.ijse.gdse72.back_end.repository.UserRepository;
import com.ijse.gdse72.back_end.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    @Override
    public ClassResponseDTO createClass(CreateClassDTO createClassDTO) {
        // Validate teacher exists
        User teacher = userRepository.findById(Math.toIntExact(createClassDTO.getCreatedBy()))
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Check passcode uniqueness
        if (createClassDTO.getPasscode() != null && !createClassDTO.getPasscode().isEmpty()) {
            if (classRepository.existsByPasscode(createClassDTO.getPasscode())) {
                throw new RuntimeException("Passcode already exists");
            }
        }

        // Use imageUrl provided by frontend (Cloudinary secure_url)
        String imageUrl = createClassDTO.getImageUrl();

        Class classEntity = Class.builder()
                .name(createClassDTO.getName())
                .description(createClassDTO.getDescription())
                .passcode(createClassDTO.getPasscode())
                .priority(createClassDTO.getPriority())
                .status(Status.ACTIVE)
                .imageUrl(imageUrl)
                .createdBy(teacher)
                .build();

        Class savedClass = classRepository.save(classEntity);
        return convertToResponseDTO(savedClass);
    }

    @Override
    public List<ClassResponseDTO> getClassesByTeacher(Long teacherId) {
        List<Class> classes = classRepository.findByCreatedByUserIdAndStatus(teacherId, Status.ACTIVE);
        return classes.stream().map(this::convertToResponseDTO).collect(Collectors.toList());
    }

    @Override
    public ClassResponseDTO getClassById(Long classId) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        return convertToResponseDTO(classEntity);
    }

    @Override
    public ClassResponseDTO updateClass(Long classId, CreateClassDTO updateDTO) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // Update fields
        classEntity.setName(updateDTO.getName());
        classEntity.setDescription(updateDTO.getDescription());
        classEntity.setPriority(updateDTO.getPriority());

        // Passcode validation
        if (updateDTO.getPasscode() != null && !updateDTO.getPasscode().isEmpty()) {
            if (!updateDTO.getPasscode().equals(classEntity.getPasscode()) &&
                    classRepository.existsByPasscode(updateDTO.getPasscode())) {
                throw new RuntimeException("Passcode already exists");
            }
            classEntity.setPasscode(updateDTO.getPasscode());
        }

        // If frontend provided a new imageUrl, update it
        if (updateDTO.getImageUrl() != null && !updateDTO.getImageUrl().isEmpty()) {
            // NOTE: if you want to delete a previously uploaded Cloudinary image,
            // you'll need to store its public_id and call Cloudinary to delete it (optional).
            classEntity.setImageUrl(updateDTO.getImageUrl());
        }

        Class updatedClass = classRepository.save(classEntity);
        return convertToResponseDTO(updatedClass);
    }

    @Override
    public void deleteClass(Long classId) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // Soft delete
        classEntity.setStatus(Status.DEACTIVE);
        classRepository.save(classEntity);
    }

    @Override
    public List<ClassResponseDTO> getClassesByPriority(Priority priority) {
        List<Class> classes = classRepository.findByPriority(priority);
        return classes.stream().map(this::convertToResponseDTO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Long> getTeacherClassStatistics(Long teacherId) {

        Map<String, Long> statistics = new HashMap<>();

        Long totalClasses = (long) classRepository.findByCreatedByUserIdAndStatus(teacherId, Status.ACTIVE).size();
        statistics.put("totalClasses", totalClasses);

        Long privateClasses = classRepository.countByTeacherAndPriority(teacherId, Priority.PRIVATE);
        statistics.put("privateClasses", privateClasses);

        Long publicClasses = classRepository.countByTeacherAndPriority(teacherId, Priority.PUBLIC);
        statistics.put("publicClasses", publicClasses);
        return statistics;
    }

    @Override
    public boolean isPasscodeUnique(String passcode) {
        return !classRepository.existsByPasscode(passcode);
    }

    @Override
    public List<ClassResponseDTO> getClassesByStudent(Long studentId) {
        // Optional: check if student exists
        User student = userRepository.findById(Math.toIntExact(studentId))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Class> classes = classRepository.findClassesByStudentId(studentId);

        return classes.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }


    private ClassResponseDTO convertToResponseDTO(Class classEntity) {
        ClassResponseDTO dto = new ClassResponseDTO();

        dto.setClassId(classEntity.getClassId());
        dto.setName(classEntity.getName());
        dto.setDescription(classEntity.getDescription());
        dto.setPasscode(classEntity.getPasscode());
        dto.setPriority(classEntity.getPriority());
        dto.setStatus(classEntity.getStatus());
        dto.setImageUrl(classEntity.getImageUrl());
        dto.setCreatedAt(classEntity.getCreatedAt());

        // Teacher info
        dto.setCreatedByName(classEntity.getCreatedBy().getUsername());
        dto.setCreatedById(classEntity.getCreatedBy().getUserId());
        dto.setCreatedByAvatarUrl(classEntity.getCreatedBy().getAvatarUrl()); // ✅ new field
        return dto;
    }

}
