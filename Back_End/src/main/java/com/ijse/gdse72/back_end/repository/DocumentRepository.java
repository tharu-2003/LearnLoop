package com.ijse.gdse72.back_end.repository;

import com.ijse.gdse72.back_end.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
}
