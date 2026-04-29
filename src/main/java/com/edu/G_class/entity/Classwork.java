package com.edu.G_class.entity;

import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.enums.QuestionType;
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

@Table(name = "assignments")
public class Classwork {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    Classes clazz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    Topic topic;

    String title;
    @Column(columnDefinition = "TEXT")
    String description;

    Integer maxPoints;

    @Enumerated(EnumType.STRING)
    ClassworkType classworkType; //ClassworkType (ASSIGNMENT, QUIZ, QUESTION, MATERIAL)

    @Builder.Default
    boolean isForAll = true;

    @ManyToMany
    @JoinTable(
            name = "assignment_recipients",
            joinColumns = @JoinColumn(name = "assignment_id"),
            inverseJoinColumns = @JoinColumn(name = "userId")
    )
    List<User> recipients;

    String externalLink; // url externalLink like google form for quiz...

    @Enumerated(EnumType.STRING)
    QuestionType questionType;

    @Column(columnDefinition = "TEXT")
    String optionsJson;  // save [] mutiple-choice answers as a JSON String

    @OneToMany(mappedBy = "classwork", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Attachment> attachments;



    @Builder.Default
    boolean canReply = false;

    @Builder.Default
    boolean canEditAnswer = false;

    @Builder.Default
    boolean showClassSummary = false;

    @CreationTimestamp
    LocalDateTime createdAt;

    LocalDateTime dueDate;
}
