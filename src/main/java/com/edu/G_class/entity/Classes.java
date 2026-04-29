package com.edu.G_class.entity;

import com.edu.G_class.enums.ClassStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "classes", uniqueConstraints = {
        @UniqueConstraint(
                name = "uc_owner_name_section",
                columnNames = {"owner_id", "name", "section"}
        )
})
public class Classes {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String description;

    String section;

    String subject;

    String room;

    @Column(unique = true, nullable = false)
    String classCode;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    User owner;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    ClassStatus status = ClassStatus.ACTIVE;

    @CreationTimestamp
    LocalDateTime createdAt;
}
