package com.edu.G_class.modules.auth.dto.response;


import lombok.Builder;

@Builder

public record IntrospectResponse(
    boolean valid
) {
}
