package com.ijse.gdse72.back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JoinClassDTO {
    private Long userId;
    private Long classId;
}
