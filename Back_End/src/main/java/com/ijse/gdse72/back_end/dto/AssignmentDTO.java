package com.ijse.gdse72.back_end.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentDTO {
    private String title;
    private String description;
    private String endDate;  // string in ISO format from frontend
    private int points;
    private String documentUrl;  // single file URL
    private Long classId;
}
