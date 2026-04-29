package com.edu.G_class.modules.auth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;


@Builder

public record AuthenticationResponse (
    String token,
    boolean authenticate
) {}
