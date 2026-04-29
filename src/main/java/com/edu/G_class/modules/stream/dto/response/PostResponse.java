package com.edu.G_class.modules.stream.dto.response;

import com.edu.G_class.enums.PostType;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record PostResponse(
    UUID id,
    UUID authorId,
    String content,
    String authorName,
    PostType type,
    UUID targetId,
    String authorAvatar,
    LocalDateTime createdAt,
    List<AttachmentResponse> attachments
) {}
