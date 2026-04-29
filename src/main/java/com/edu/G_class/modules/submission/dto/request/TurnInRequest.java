package com.edu.G_class.modules.submission.dto.request;

import java.util.List;
import java.util.UUID;

public record TurnInRequest(
        List<UUID> attachmentIds
) {}
