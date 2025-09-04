package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RegisterDTO {

    private Long id;

    @NotBlank(message = "Your name is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotNull(message = "Phone number is required")
    private Integer phoneNumber;

    @NotBlank(message = "Password is required")
    private String password;

    private Role role;
}
