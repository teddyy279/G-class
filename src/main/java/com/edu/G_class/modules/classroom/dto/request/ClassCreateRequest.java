package com.edu.G_class.modules.classroom.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

public record ClassCreateRequest(
        @NotBlank(message = "Class name is required")
        String name,
        String description,
        String section,
        String subject,
        String room
) {}
