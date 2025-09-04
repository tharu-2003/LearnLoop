package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.*;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

public class ClassDTO {

    private Long classId;
    private String name;
    private String description;
    private String passcode;
    private LocalDateTime createdAt;
    private Priority priority;
    private Status status;
    private List<User> users;
    private List<Assignment> assignments;
    private List<Discussion> discussions;
    private List<Chat> chats;

}
