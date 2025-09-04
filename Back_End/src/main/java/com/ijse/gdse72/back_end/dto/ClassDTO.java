package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassDTO {
    private Long classId;
    private String name;
    private String description;
    private String passcode;
    private LocalDateTime createdAt;
    private Priority priority;
    private Status status;
    private String imageUrl;
    private Integer studentCount;
}