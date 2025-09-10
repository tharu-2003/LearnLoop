package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.*;
import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.entity.Status;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.ClassRepository;
import com.ijse.gdse72.back_end.repository.UserRepository;
import com.ijse.gdse72.back_end.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
    public List<ClassResponseDTO> getAllClasses() {
        List<Class> classes = classRepository.findAllActiveClasses();
        return classes.stream()
                .map(cls -> {
                    ClassResponseDTO dto = convertToResponseDTO(cls);
                    // Add student count
                    dto.setStudentCount(cls.getUsers() != null ? cls.getUsers().size() : 0);
                    return dto;
                })
                .collect(Collectors.toList());
    }


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

    @Override
    public StudentClassStatisticsDTO getStudentClassStatistics(Long studentId) {
        User student = userRepository.findById(Math.toIntExact(studentId))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Class> classes = classRepository.findClassesByStudentId(studentId);

        long totalClasses = classes.size();
        long privateClasses = classes.stream().filter(c -> c.getPriority() == Priority.PRIVATE).count();
        long publicClasses = classes.stream().filter(c -> c.getPriority() == Priority.PUBLIC).count();

        // Count students in each category
        long totalStudents = classes.stream().mapToLong(c -> c.getUsers().size()).sum();
        long privateStudents = classes.stream()
                .filter(c -> c.getPriority() == Priority.PRIVATE)
                .mapToLong(c -> c.getUsers().size()).sum();
        long publicStudents = classes.stream()
                .filter(c -> c.getPriority() == Priority.PUBLIC)
                .mapToLong(c -> c.getUsers().size()).sum();

        return new StudentClassStatisticsDTO(
                totalClasses,
                privateClasses,
                publicClasses,
                totalStudents,
                privateStudents,
                publicStudents
        );
    }


    @Override
    public TeacherClassStatisticsDTO getTeacherClassStatistics(Long teacherId) {
        List<Class> classes = classRepository.findByCreatedByUserIdAndStatus(teacherId, Status.ACTIVE);

        long totalClasses = classes.size();
        long privateClasses = classRepository.countByTeacherAndPriority(teacherId, Priority.PRIVATE);
        long publicClasses = classRepository.countByTeacherAndPriority(teacherId, Priority.PUBLIC);

        long totalStudents = classes.stream().mapToLong(c -> c.getUsers().size()).sum();
        long privateStudents = classes.stream()
                .filter(c -> c.getPriority() == Priority.PRIVATE)
                .mapToLong(c -> c.getUsers().size())
                .sum();
        long publicStudents = classes.stream()
                .filter(c -> c.getPriority() == Priority.PUBLIC)
                .mapToLong(c -> c.getUsers().size())
                .sum();

        return TeacherClassStatisticsDTO.builder()
                .totalClasses(totalClasses)
                .privateClasses(privateClasses)
                .publicClasses(publicClasses)
                .totalStudents(totalStudents)
                .privateStudents(privateStudents)
                .publicStudents(publicStudents)
                .build();
    }

    @Override
    public void joinClass(JoinClassDTO joinDTO) {
        // Fetch student
        User student = userRepository.findById(Math.toIntExact(joinDTO.getUserId()))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Fetch class
        Class classEntity = classRepository.findById(joinDTO.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // Initialize users list if null
        if (classEntity.getUsers() == null) {
            classEntity.setUsers(new ArrayList<>());
        }

        // Check if student already joined
        boolean alreadyJoined = classEntity.getUsers().stream()
                .anyMatch(u -> u.getUserId().equals(student.getUserId()));

        if (alreadyJoined) {
            throw new RuntimeException("Already joined this class");
        }

        // Add student and save
        classEntity.getUsers().add(student);
        classRepository.save(classEntity);
    }

    @Override
    public List<ClassResponseDTO> getClassesNotJoinedByStudent(Long studentId) {
        User student = userRepository.findById(Math.toIntExact(studentId))
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Class> classes = classRepository.findClassesNotJoinedByStudent(student);
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

        dto.setStudentCount(classEntity.getUsers() != null ? classEntity.getUsers().size() : 0);
        return dto;
    }

}
