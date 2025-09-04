package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Assignment;
import com.ijse.gdse72.back_end.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.time.LocalDateTime;

public class SubmissionDTO {

    private Long id;
    private LocalDateTime submittedAt;
    private User user;
    private Assignment assignment;
}
