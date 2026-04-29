package com.edu.G_class.entity;

import com.edu.G_class.enums.AttachmentType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "attachments")
public class Attachment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, length = 2048)
    String fileUrl;

    @Column(length = 1000)
    String fileName;

    String contentType;

    @Enumerated(EnumType.STRING)
    AttachmentType attachmentType;

    @Column(length = 2048)
    String thumbnailUrl;

    String publicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classwork_id")
    Classwork classwork;
}
