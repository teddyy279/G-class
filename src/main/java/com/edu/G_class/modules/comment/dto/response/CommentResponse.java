package com.edu.G_class.modules.comment.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    String content,
    UUID authorId,
    String authorName,
    boolean isPrivate,
    LocalDateTime createdAt
) {}
