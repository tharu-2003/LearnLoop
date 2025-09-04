package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.User;


import java.time.LocalDateTime;

public class ChatDTO {

    private Long chatId;
    private LocalDateTime createdAt;
    private String message;
    private User user;
    private Class classEntity;
}
