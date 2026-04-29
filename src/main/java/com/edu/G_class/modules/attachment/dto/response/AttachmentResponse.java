package com.edu.G_class.modules.attachment.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.UUID;

@Builder


@JsonInclude(JsonInclude.Include.NON_NULL)
public record AttachmentResponse(
   UUID id,
   String fileUrl,
   String fileName,
   String fileType,
   String attachmentType,
   String thumbernailUrl
) {}
