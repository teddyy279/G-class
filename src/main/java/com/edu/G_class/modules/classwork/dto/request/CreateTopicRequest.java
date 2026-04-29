package com.edu.G_class.modules.classwork.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateTopicRequest(
    @NotBlank String name
) {}
