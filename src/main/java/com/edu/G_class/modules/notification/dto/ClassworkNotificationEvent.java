package com.edu.G_class.modules.notification.dto;

import com.edu.G_class.enums.ClassworkType;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder

public record ClassworkNotificationEvent(
        UUID classId,
        UUID classworkId,
        String title,
        String authorName,
        ClassworkType type,
        List<UUID> targetStudentIds
) {}
