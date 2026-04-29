package com.edu.G_class.modules.submission.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public record GradeSubmissionRequest(
        @DecimalMin("0") @DecimalMax("100")
        Float score,
        String feedback
) {}
