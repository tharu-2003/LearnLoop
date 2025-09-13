package com.ijse.gdse72.back_end.controller;

import com.ijse.gdse72.back_end.dto.ApiResponse;
import com.ijse.gdse72.back_end.dto.AssignmentDTO;
import com.ijse.gdse72.back_end.entity.Assignment;
import com.ijse.gdse72.back_end.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth/assignments")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "http://localhost:5501",
        allowedHeaders = "*",
        allowCredentials = "true",
        methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS }
)
public class AssignmentController {

    private final AssignmentService assignmentService;

    // CREATE
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createAssignment(@RequestBody AssignmentDTO assignmentDTO) {
        try {
            Assignment createdAssignment = assignmentService.createAssignment(assignmentDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Assignment created successfully", createdAssignment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, e.getMessage(), null));
        }
    }


    // GET all assignments for a class
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse> getAssignmentsByClass(@PathVariable Long classId) {
        try {
            List<Assignment> assignments = assignmentService.getAssignmentsByClass(classId);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Assignments retrieved successfully",
                    assignments
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    400,
                    e.getMessage(),
                    null
            ));
        }
    }
}
