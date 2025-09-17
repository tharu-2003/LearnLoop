// ChatController.java
package com.ijse.gdse72.back_end.controller;

import com.ijse.gdse72.back_end.dto.ChatMessageDTO;
import com.ijse.gdse72.back_end.entity.Chat;
import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.ChatRepository;
import com.ijse.gdse72.back_end.repository.ClassRepository;
import com.ijse.gdse72.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatRepository chatRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    // --- WebSocket Send ---
    @MessageMapping("/sendMessage") // /app/sendMessage
    public void sendMessage(@Payload ChatMessageDTO chatMessage) {
        Class clas = classRepository.findById(Long.valueOf(chatMessage.getClassId())).orElseThrow();
        User user = userRepository.findById(Integer.valueOf(chatMessage.getSenderId())).orElseThrow();

        Chat chat = Chat.builder()
                .message(chatMessage.getMessage())
                .receiverId(Long.valueOf(chatMessage.getReceiverId()))
                .user(user) // you can set sender User
                .classEntity(clas) // if needed
                .build();

        chatRepository.save(chat);

        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getReceiverId()), // must be a String username or sessionId
                "/topic/messages",
                chatMessage
        );

    }

    // --- REST Fetch Previous Messages ---
    @GetMapping("/{senderId}/{receiverId}")
    public List<ChatMessageDTO> getChatHistory(@PathVariable String senderId, @PathVariable String receiverId) {

        List<Chat> chats = chatRepository.findBySenderAndReceiver(senderId, receiverId);

        return chats.stream().map(c -> ChatMessageDTO.builder()
                        .chatId(c.getChatId())
                        .senderId(String.valueOf(c.getUser().getUserId()))
                        .receiverId(String.valueOf(c.getReceiverId()))
                        .message(c.getMessage())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

//    @GetMapping("/{user1}/{user2}")
//    public List<Chat> getChatHistory(@PathVariable Long user1,
//                                     @PathVariable Long user2) {
//        return chatRepository.findBySenderAndReceiver(String.valueOf(user1), String.valueOf(user2));
//    }

}
