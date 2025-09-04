package com.ijse.gdse72.back_end.dto;

import com.ijse.gdse72.back_end.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

public class DocumentDTO {

    private Long documentId;
    private String documentName;
    private User user;
}
