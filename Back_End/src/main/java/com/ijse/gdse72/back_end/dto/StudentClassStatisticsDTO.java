package com.ijse.gdse72.back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentClassStatisticsDTO {
    private Long totalClasses;
    private Long privateClasses;
    private Long publicClasses;
    private Long totalStudents;
    private Long privateStudents;
    private Long publicStudents;
}
