package com.edu.G_class.modules.classroom.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder

public record MemberResponse(
    UUID userId,
    String fullName,
    String avatar,
    boolean isOwner
) {}
