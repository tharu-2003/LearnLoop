package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateClassDTO {

    private String name;
    private String description;
    private String passcode;
    private Priority priority;
    private Long createdBy; // Teacher's user ID

    // NEW: Cloudinary image URL (optional)
    private String imageUrl;
}
