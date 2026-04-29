package com.edu.G_class.modules.classroom.dto.response;

import lombok.Builder;

import java.util.UUID;
@Builder
public record ClassDetailResponse(
        UUID id,
        String name,
        String description,
        String classCode,
        String subject,
        String section,
        String room,
        UUID ownerId
) {}
