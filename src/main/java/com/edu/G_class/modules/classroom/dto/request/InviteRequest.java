package com.edu.G_class.modules.classroom.dto.request;

import com.edu.G_class.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

public record InviteRequest(
    @NotNull String email,
    @NotNull UUID classId,
    @NotNull Role role
) {}
