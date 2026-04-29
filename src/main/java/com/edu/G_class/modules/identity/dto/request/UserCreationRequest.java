package com.edu.G_class.modules.identity.dto.request;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreationRequest(
    @NotBlank(message = "USERNAME_NOT_NULL")
    @Size(min = 3, message = "USERNAME_INVALID")
    String username,

    @NotBlank(message = "EMAIL_NOT_NULL")
    @Email(message = "EMAIL_INVALID")
    String email,

    @NotBlank(message = "PASSWORD NOT NULL")
    @Size(min = 8, message = "INVALID_PASSWORD")
    String password,

//    String email,
    String fullName
) {}