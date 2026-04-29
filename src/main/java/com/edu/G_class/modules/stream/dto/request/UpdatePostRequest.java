package com.edu.G_class.modules.stream.dto.request;


import lombok.Builder;

import java.util.List;
import java.util.UUID;

public record UpdatePostRequest(
    String content,
    List<UUID> attachmentIds,

    List<UUID> targetStudentIds
) {}
