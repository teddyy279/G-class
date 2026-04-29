package com.edu.G_class.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
    @NotBlank(message = "INVALID_PASSWORD")
    String oldPassword,

    @Size(min = 8, message = "INVALID_PASSWORD")
    String newPassword
) {}
