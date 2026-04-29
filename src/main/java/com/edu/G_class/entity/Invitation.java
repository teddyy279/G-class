package com.edu.G_class.entity;

import com.edu.G_class.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Table(name = "invitations")
public class Invitation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    String email;
    UUID classId;

    @Enumerated(EnumType.STRING)
    Role role;

    @CreationTimestamp
    LocalDateTime createdAt;

    LocalDateTime expiredsAT;

    @Builder.Default
    boolean accepted = false;
}
