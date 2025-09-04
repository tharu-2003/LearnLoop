package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.User;

import java.time.LocalDateTime;

public class NotificationDTO {

    private Long notificationId;
    private LocalDateTime createdAt;
    private String description;
    private User user;
}
