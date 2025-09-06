//package com.ijse.gdse72.back_end.controller;
//
//
//import org.springframework.core.io.Resource;
//import org.springframework.core.io.UrlResource;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//
//@CrossOrigin
//@RestController
//@RequestMapping("/file/")
//public class FileController {
//
//    private final String uploadDir = "uploads/class-images/";
//
//
//    @GetMapping("/{filename:.+}")
//    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
//        try {
//            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
//            Resource resource = new UrlResource(filePath.toUri());
//
//            if (!resource.exists() || !resource.isReadable()) {
//                return ResponseEntity.notFound().build();
//            }
//
//            String contentType = determineContentType(filename);
//
//            return ResponseEntity.ok()
//                    .contentType(MediaType.parseMediaType(contentType))
//                    .header(HttpHeaders.CONTENT_DISPOSITION,
//                            "inline; filename=\"" + resource.getFilename() + "\"")
//                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
//                    .body(resource);
//        } catch (Exception ex) {
//            return ResponseEntity.internalServerError().build();
//        }
//    }
//
//    private String determineContentType(String filename) throws IOException {
//        Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
//        String contentType = Files.probeContentType(filePath);
//
//        if (contentType == null) {
//            String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
//            switch (extension) {
//                case "jpg":
//                case "jpeg":
//                    return "image/jpeg";
//                case "png":
//                    return "image/png";
//                case "pdf":
//                    return "application/pdf";
//                default:
//                    return "application/octet-stream";
//            }
//        }
//        return contentType;
//    }
//
//}


package com.ijse.gdse72.back_end.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/file")
public class FileController {

    private final String uploadDir = "uploads/class-images/";
    private final Map<String, String> contentTypes = new HashMap<>();

    public FileController() {
        // Initialize content type mappings
        contentTypes.put("jpg", "image/jpeg");
        contentTypes.put("jpeg", "image/jpeg");
        contentTypes.put("png", "image/png");
        contentTypes.put("gif", "image/gif");
        contentTypes.put("pdf", "application/pdf");
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();

            // Security check: ensure the file is within the intended directory
            if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filename);

            // Set cache control headers for better performance
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600") // 1 hour cache
                    .header(HttpHeaders.EXPIRES, "3600")
                    .body(resource);

        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String determineContentType(String filename) throws IOException {
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        // Use our predefined content types first
        if (contentTypes.containsKey(extension)) {
            return contentTypes.get(extension);
        }

        // Fall back to system detection
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            String detectedType = Files.probeContentType(filePath);
            return detectedType != null ? detectedType : "application/octet-stream";
        } catch (Exception e) {
            return "application/octet-stream";
        }
    }

    // Optional: Add an endpoint to check if a file exists
    @GetMapping("/exists/{filename:.+}")
    public ResponseEntity<Map<String, Boolean>> checkFileExists(@PathVariable String filename) {
        Map<String, Boolean> response = new HashMap<>();
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            boolean exists = Files.exists(filePath) && Files.isReadable(filePath);
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("exists", false);
            return ResponseEntity.ok(response);
        }
    }
}