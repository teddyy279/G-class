package com.edu.G_class.modules.classroom.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record CreateClassResponse(
        UUID id,
        String name,
        String description,
        String section,
        String classCode,
        String ownerName,
        String ownerAvatar,
        LocalDateTime createdAt
) {}