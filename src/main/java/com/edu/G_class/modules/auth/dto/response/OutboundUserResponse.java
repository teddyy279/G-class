package com.edu.G_class.modules.auth.dto.response;

import lombok.Builder;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.PropertyNamingStrategy;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record OutboundUserResponse(
    String id,
    String email,
    Boolean verifiedEmail,
    String name,
    String givenName,
    String familyName,
    String picture,
    String locale
) {}
