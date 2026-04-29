package com.edu.G_class.modules.classroom.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ClassUpdateRequest(
    @NotBlank(message = "The class name cannot be left blank")
    String name,
    String description,
    String subject,
    String room,
    String section
) {}
