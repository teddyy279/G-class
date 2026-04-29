package com.edu.G_class.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank String email,
    @NotBlank String otp,
    @Size(min = 8, message = "INVALID_PASSWORD")
    String newPassword
) {}
