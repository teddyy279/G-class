package com.edu.G_class.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OtpRequest(
    @Email(message = "EMAIL_INVALID")
    @NotBlank(message = "EMAIL_IS_REQUIRED")
    String email
) {}
