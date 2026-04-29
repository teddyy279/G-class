package com.edu.G_class.entity;
import com.edu.G_class.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "submissions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_submission_classwork_student",
                columnNames = {"classwork_id", "student_id"}
        ))

public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classwork_id")
    Classwork classwork;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    User student;

    // Một bài nộp có thể có nhiều file đính kèm
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    List<Attachment> attachments;

    @Column(nullable = false)
    @Builder.Default
    Integer version = 1;

    @Enumerated(EnumType.STRING)
    SubmissionStatus status;

    Float score;

    @Column(columnDefinition = "TEXT")
    String feedback;

    @CreationTimestamp
    LocalDateTime submittedAt;
}
