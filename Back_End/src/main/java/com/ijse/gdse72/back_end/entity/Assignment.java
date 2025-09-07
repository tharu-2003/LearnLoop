package com.ijse.gdse72.back_end.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Long assignmentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(columnDefinition = "TEXT")
    private String paper;

    private int mark;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnore
    private Class classEntity;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Submission> submissions;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
