// ChatRepository.java
package com.ijse.gdse72.back_end.repository;

import com.ijse.gdse72.back_end.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("SELECT c FROM Chat c WHERE " +
            "(c.user.userId = :senderId AND c.receiverId = :receiverId) OR " +
            "(c.user.userId = :receiverId AND c.receiverId = :senderId) " +
            "ORDER BY c.createdAt ASC")
    List<Chat> findBySenderAndReceiver(String senderId, String receiverId);
}
