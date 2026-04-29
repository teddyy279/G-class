package com.edu.G_class.modules.comment.dto.request;

import com.edu.G_class.enums.CommentType;

import java.util.UUID;

public record CommentRequest(
        String content,
        CommentType type,
        boolean isPrivate,
        UUID studentId
) {
}
