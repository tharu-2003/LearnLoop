package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

public class DiscussionDTO {

    private Long discId;
    private LocalDateTime createdAt;
    private String document;
    private String description;
    private Class classEntity;

    private List<User> users;
}
