package com.edu.G_class.modules.submission.dto.response;

import com.edu.G_class.enums.SubmissionStatus;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SubmissionResponse(
        UUID id,
        UUID studentId,
        String studentName,
        SubmissionStatus status,
        Integer version,
        Float score,
        String feedback,
        LocalDateTime submittedAt,
        List<AttachmentResponse> attachments
) {}
