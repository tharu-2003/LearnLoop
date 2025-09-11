package com.ijse.gdse72.back_end.service;

import com.ijse.gdse72.back_end.dto.DocumentDTO;
import com.ijse.gdse72.back_end.entity.Document;

import java.io.IOException;
import java.util.List;

public interface DocumentService {
    Document saveDocument(DocumentDTO dto, Long userId) throws IOException;
    List<Document> getAllDocuments();
    Document getDocumentById(Long id);
    void deleteDocument(Long id);

    List<Document> getDocumentsByUserId(Long userId);

}
