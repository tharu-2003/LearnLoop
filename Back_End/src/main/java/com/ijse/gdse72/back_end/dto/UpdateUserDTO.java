package com.ijse.gdse72.back_end.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserDTO {
    private String username;
    private String email;
    private Integer phoneNumber;
    private String avatarUrl;
}
