package com.edu.G_class.modules.submission.repository;

import com.edu.G_class.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.attachments WHERE s.classwork.id = :classworkId AND s.student.id = :studentId")
    Optional<Submission> findByClassworkIdAndStudentId(@Param("classworkId") UUID classworkId, @Param("studentId") UUID studentId);

    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.student LEFT JOIN FETCH s.attachments WHERE s.classwork.id = :classworkId")
    List<Submission> findAllByClassworkId(@Param("classworkId") UUID classworkId);
}
