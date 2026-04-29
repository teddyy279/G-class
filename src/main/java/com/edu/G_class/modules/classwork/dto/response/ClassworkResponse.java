package com.edu.G_class.modules.classwork.dto.response;

import com.edu.G_class.enums.ClassworkType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ClassworkResponse(
        UUID id,
        String title,
        String description,
        ClassworkType classworkType,
        Integer maxPoints,
        LocalDateTime dueDate,
        LocalDateTime createdAt,
        String authorName,
        UUID topicId,
        String optionsJson,
        Boolean canReply,
        Boolean canEditAnswer,
        Boolean showClassSummary
) {}