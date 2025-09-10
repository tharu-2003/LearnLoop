package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.DocumentDTO;
import com.ijse.gdse72.back_end.entity.Document;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.DocumentRepository;
import com.ijse.gdse72.back_end.repository.UserRepository;
import com.ijse.gdse72.back_end.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    private static final String TEMPLATE_DIR = "src/main/resources/static/assets/templates/";

    @Override
    public Document saveDocument(DocumentDTO dto, Long userId) throws IOException {
        // Ensure template directory exists
        Path dirPath = Paths.get(TEMPLATE_DIR);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        // Generate safe filename
        String safeTitle = dto.getTitle().replaceAll("[^a-zA-Z0-9]", "_");
        String filename = safeTitle + "_" + System.currentTimeMillis() + ".html";

        // Save HTML content to file
        Path filePath = dirPath.resolve(filename);
        Files.write(filePath, dto.getContent().getBytes());

        // Fetch user
        User user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Build and save Document entity
        Document document = Document.builder()
                .title(dto.getTitle())
                .documentType(dto.getDocumentType())
                .documentPath("/assets/templates/" + filename)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .user(user)
                .build();

        return documentRepository.save(document);
    }

    @Override
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    @Override
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    @Override
    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }
}
