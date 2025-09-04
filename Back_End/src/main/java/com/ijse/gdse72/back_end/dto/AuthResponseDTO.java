package com.ijse.gdse72.back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class AuthResponseDTO {

    private String accessToken;

    private String username;
    private String email;
    private String role;
    private Integer phoneNumber;
}
