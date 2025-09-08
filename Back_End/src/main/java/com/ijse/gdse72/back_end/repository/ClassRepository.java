package com.ijse.gdse72.back_end.repository;

import com.ijse.gdse72.back_end.entity.Class;
import com.ijse.gdse72.back_end.entity.Priority;
import com.ijse.gdse72.back_end.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<Class, Long> {

    // Find classes by teacher (created by)
    List<Class> findByCreatedByUserId(Long teacherId);

    // Find classes by priority
    List<Class> findByPriority(Priority priority);

    // Find active classes by teacher
    List<Class> findByCreatedByUserIdAndStatus(Long teacherId, Status status);

    // Find classes by teacher and priority
    List<Class> findByCreatedByUserIdAndPriority(Long teacherId, Priority priority);

    // Check if passcode exists
    boolean existsByPasscode(String passcode);

    // Custom query to count classes by priority for a teacher
    @Query("SELECT COUNT(c) FROM Class c WHERE c.createdBy.userId = :teacherId AND c.priority = :priority")
    Long countByTeacherAndPriority(@Param("teacherId") Long teacherId, @Param("priority") Priority priority);

    // Find all active classes where a user (student) is enrolled
    @Query("SELECT c FROM Class c JOIN c.users u WHERE u.userId = :studentId AND c.status = 'ACTIVE'")
    List<Class> findClassesByStudentId(@Param("studentId") Long studentId);


}