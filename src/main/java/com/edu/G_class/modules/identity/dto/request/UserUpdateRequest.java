package com.edu.G_class.modules.identity.dto.request;

public record UserUpdateRequest(
    String password,
    String fullName,
    String avatar
) {}
