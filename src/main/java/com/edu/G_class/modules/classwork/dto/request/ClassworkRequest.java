package com.edu.G_class.modules.classwork.dto.request;

import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ClassworkRequest(
        @NotBlank String title,
        String description,
        ClassworkType type,
        LocalDateTime dueDate,
        Integer maxPoints,
        UUID topicId,
        QuestionType questionType,
        String externalLink,
        List<UUID> attachmentIds,
        List<UUID> targetStudentIds,
        List<String> options,

        Boolean canReply,
        Boolean canEditAnswer,
        Boolean showClasssummary
) {}
