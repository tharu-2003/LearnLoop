package com.ijse.gdse72.back_end.repository;

import com.ijse.gdse72.back_end.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUser_UserId(Long userId);
}
