package com.ijse.gdse72.back_end.controller;

import com.ijse.gdse72.back_end.dto.*;
import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://127.0.0.1:5501", "http://localhost:5501"})
public class ClassController {

    private final ClassService classService;

    // CREATE - accept JSON body (frontend will send imageUrl field if available)
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createClass(@RequestBody CreateClassDTO createClassDTO) {
        try {
            ClassResponseDTO createdClass = classService.createClass(createClassDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Class created successfully", createdClass));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse> getClassesByTeacher(@PathVariable Long teacherId) {
        try {
            List<ClassResponseDTO> classes = classService.getClassesByTeacher(teacherId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Classes retrieved successfully",
                    classes
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse> getClassById(@PathVariable Long classId) {
        try {
            ClassResponseDTO classDto = classService.getClassById(classId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Class retrieved successfully",
                    classDto
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }

    // UPDATE - accept JSON body
    @PutMapping("/{classId}")
    public ResponseEntity<ApiResponse> updateClass(
            @PathVariable Long classId,
            @RequestBody CreateClassDTO updateDTO) {

        try {
            ClassResponseDTO updatedClass = classService.updateClass(classId, updateDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Class updated successfully", updatedClass));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{classId}")
    public ResponseEntity<ApiResponse> deleteClass(@PathVariable Long classId) {
        try {
            classService.deleteClass(classId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Class deleted successfully",
                    null
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<ApiResponse> getClassesByPriority(@PathVariable String priority) {
        try {
            Priority priorityEnum = Priority.valueOf(priority.toUpperCase());
            List<ClassResponseDTO> classes = classService.getClassesByPriority(priorityEnum);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Classes retrieved successfully",
                    classes
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    "Invalid priority value",
                    null
            ));
        }
    }

//    @GetMapping("/statistics/{teacherId}")
//    public ResponseEntity<ApiResponse> getTeacherStatistics(@PathVariable Long teacherId) {
//        try {
//            Map<String, Long> statistics = classService.getTeacherClassStatistics(teacherId);
//            return ResponseEntity.ok(new ApiResponse(
//                    200,
//                    "Statistics retrieved successfully",
//                    statistics
//            ));
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(new ApiResponse(
//                    400,
//                    e.getMessage(),
//                    null
//            ));
//        }
//    }

    @GetMapping("/statistics/{teacherId}")
    public ResponseEntity<ApiResponse> getTeacherStatistics(@PathVariable Long teacherId) {
        try {
            TeacherClassStatisticsDTO stats = classService.getTeacherClassStatistics(teacherId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Statistics retrieved successfully",
                    stats
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/check-passcode")
    public ResponseEntity<ApiResponse> checkPasscodeUnique(@RequestParam String passcode) {
        boolean isUnique = classService.isPasscodeUnique(passcode);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Passcode check completed",
                Map.of("isUnique", isUnique)
        ));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse> getClassesByStudent(@PathVariable Long studentId) {
        try {
            List<ClassResponseDTO> classes = classService.getClassesByStudent(studentId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Student classes retrieved successfully",
                    classes
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }

    @GetMapping("/student-statistics/{studentId}")
    public ResponseEntity<ApiResponse> getStudentClassStatistics(@PathVariable Long studentId) {
        try {
            StudentClassStatisticsDTO stats = classService.getStudentClassStatistics(studentId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Student class statistics retrieved successfully",
                    stats
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }

}