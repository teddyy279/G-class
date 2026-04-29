package com.edu.G_class.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AuthenticationRequest (
    @NotBlank(message = "USERNAME_INVALID")
    String username,
    @NotBlank(message = "INVALID_PASSWORD")
    String password
) {}
