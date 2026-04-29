package com.edu.G_class.modules.classroom.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder

public record ClassResponse(
    UUID id,
    String name,
    String description,
    String classCode,
    String subject,
    String section,
    String room,
    String ownerName,
    String ownerAvatar,
    UUID ownerId
) {}
