// ChatMessageDTO.java
package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long chatId;
    private String senderId;
    private String receiverId;
    private String classId;
    private String message;
    private LocalDateTime createdAt;

    private User receiverUser;
}
