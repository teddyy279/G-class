package com.edu.G_class.modules.notification.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder

public record NotificationRequest(
    String to, //email consumer
    String subject,// tiêu đề thư
    String body, //nội dung thông báo
    UUID authorId,
    UUID classId,
    UUID postId,
    UUID classworkId,
    List<UUID> recipientIds
) {}
