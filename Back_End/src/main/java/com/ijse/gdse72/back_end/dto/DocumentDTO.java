package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.DocumentType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDTO {
    private Long userId;    //aditionaly added
    private String title;
    private DocumentType documentType;
    private String content;
}

