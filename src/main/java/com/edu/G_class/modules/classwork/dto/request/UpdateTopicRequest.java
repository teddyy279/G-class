package com.edu.G_class.modules.classwork.dto.request;

import java.util.UUID;

public record UpdateTopicRequest(
    UUID topicId,
    String newName
) {}
