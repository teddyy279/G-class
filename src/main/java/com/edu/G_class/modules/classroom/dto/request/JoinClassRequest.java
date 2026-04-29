package com.edu.G_class.modules.classroom.dto.request;

import jakarta.validation.constraints.NotBlank;

public record JoinClassRequest(
   // @NotBlank
   @NotBlank(message = "Mã lớp không được trống")
   String classCode
) {}
