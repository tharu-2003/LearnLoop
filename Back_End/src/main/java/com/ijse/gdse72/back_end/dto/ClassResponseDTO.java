package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClassResponseDTO {

    private Long classId;
    private String name;
    private String description;
    private String passcode;
    private Priority priority;
    private Status status;
    private String imageUrl;
    private LocalDateTime createdAt;

    private String createdByName; // Teacher's name
    private Long createdById;    // Teacher's ID

    private String createdByAvatarUrl; //Teacher's profile image
}