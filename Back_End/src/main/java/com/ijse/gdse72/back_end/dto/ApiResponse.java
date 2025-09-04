package com.ijse.gdse72.back_end.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class ApiResponse {

    private int code;
    private String status;
    private Object data;
}
