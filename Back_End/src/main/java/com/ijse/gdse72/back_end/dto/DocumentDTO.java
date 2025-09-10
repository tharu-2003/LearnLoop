package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.DocumentType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDTO {
    private Long documentId;     // Add this for frontend mapping
    private Long userId;
    private String title;
    private DocumentType documentType;
    private String content;      // For saving HTML
    private String documentPath;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

