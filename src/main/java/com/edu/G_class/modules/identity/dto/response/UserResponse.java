package com.edu.G_class.modules.identity.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Set;

public record UserResponse(
    UUID id,
    String username,
    String fullName,
    String email,
    String avatar,
    String authProvider,
    LocalDateTime createAt,
    Set<String> roles
) {}
