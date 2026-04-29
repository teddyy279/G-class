package com.edu.G_class.entity;

import com.edu.G_class.enums.PostType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;


@Entity

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne
    @JoinColumn(name = "class_id")
    Classes clazz;

    @ManyToOne
    @JoinColumn(name = "user_id")
    User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    boolean isForAll;

    @ManyToMany
    @JoinTable(
            name = "post_recipients",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "userId")
    )
    List<User> recipients;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    List<Attachment> attachments;

    @Version
    Long version;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    PostType type = PostType.ANNOUNCEMENT;

    UUID targetId; //save Id of classwork so that when you click on a Post, you'll be taken directly to the assignment.

    @CreationTimestamp
    LocalDateTime createdAt;
}
