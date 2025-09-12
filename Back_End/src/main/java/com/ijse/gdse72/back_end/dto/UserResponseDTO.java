package com.ijse.gdse72.back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponseDTO {
    private Long userId;
    private String username;
    private String email;
    private Integer phoneNumber;
    private String role;
    private String avatarUrl;
}
