package com.edu.G_class.modules.auth.dto.request;


import lombok.Builder;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ExchangeTokenRequest(
    String code,
    String clientId,
    String clientSecret,
    String redirectUri,
    String grantType
) {}
