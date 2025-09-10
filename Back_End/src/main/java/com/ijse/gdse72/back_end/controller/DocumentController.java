package com.ijse.gdse72.back_end.controller;

import com.ijse.gdse72.back_end.dto.DocumentDTO;
import com.ijse.gdse72.back_end.entity.Document;
import com.ijse.gdse72.back_end.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/auth/documents")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "http://localhost:5501",
        allowedHeaders = "*",
        allowCredentials = "true",
        methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS }
)
public class DocumentController {

    private final DocumentService documentService;

    // Save new document
    @PostMapping
    public ResponseEntity<Document> saveDocument(@RequestBody DocumentDTO dto, Principal principal) throws IOException {
        Long userId = dto.getUserId();
        Document savedDoc = documentService.saveDocument(dto, userId);
        return ResponseEntity.ok(savedDoc);
    }


    @GetMapping
    public ResponseEntity<List<DocumentDTO>> getAllDocuments() {
        List<DocumentDTO> documents = documentService.getAllDocuments()
                .stream()
                .map(doc -> DocumentDTO.builder()
                        .documentId(doc.getDocumentId())
                        .userId(doc.getUser().getUserId())
                        .title(doc.getTitle())
                        .documentType(doc.getDocumentType())
                        .documentPath(doc.getDocumentPath())
                        .createdAt(doc.getCreatedAt())
                        .updatedAt(doc.getUpdatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(documents);
    }


    // Get single document
    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    // Delete document
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok("Document deleted successfully");
    }
}
