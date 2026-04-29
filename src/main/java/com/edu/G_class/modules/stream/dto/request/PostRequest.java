package com.edu.G_class.modules.stream.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

public record PostRequest(
    @NotBlank(message = "Content cannot be left blank")
    String content,
    List<UUID> targetStudentIds,
    List<UUID> attachmentIds
) {}
