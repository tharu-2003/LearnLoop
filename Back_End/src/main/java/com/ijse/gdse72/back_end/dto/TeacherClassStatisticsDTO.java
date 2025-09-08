package com.ijse.gdse72.back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherClassStatisticsDTO {
    private Long totalClasses;
    private Long totalStudents;
    private Long privateClasses;
    private Long publicClasses;
    private Long privateStudents;
    private Long publicStudents;
}
