package com.edu.G_class.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Entity

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "topics")
public class Topic {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    Classes clazz;

    @Column(nullable = false)
    String name;

    @OneToMany(mappedBy = "topic")
    @OrderBy("createdAt DESC")
    List<Classwork> classworks;

    @Version
    Long version;

    @CreationTimestamp
    LocalDateTime createdAt;


}
