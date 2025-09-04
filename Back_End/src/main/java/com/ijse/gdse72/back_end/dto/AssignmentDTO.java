package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.Submission;


import java.time.LocalDateTime;
import java.util.List;

public class AssignmentDTO {


    private Long assignmentId;
    private LocalDateTime createdAt;
    private String message;
    private LocalDateTime endDate;
    private String paper;
    private int mark;

    private Class classEntity;

    private List<Submission> submissions;

}
