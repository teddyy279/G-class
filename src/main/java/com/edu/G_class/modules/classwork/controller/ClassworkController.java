package com.edu.G_class.modules.classwork.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.dto.response.ClassworkResponse;
import com.edu.G_class.modules.classwork.service.ClassworkService;
import com.edu.G_class.modules.attachment.service.AttachmentService;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;


@RestController
@RequestMapping("/class/{classId}/classworks")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassworkController {
    ClassworkService classworkService;
    AttachmentService attachmentService;

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentResponse> uploadClassworkAttachment(
            @PathVariable UUID classId,
            @RequestParam("file") MultipartFile file) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String folderPath = String.format("class_%s/classworks/user_%s", classId, userId);
        return ApiResponse.<AttachmentResponse>builder()
                .result(attachmentService.createAttachment(file, folderPath))
                .build();
    }

    @PostMapping
    public ApiResponse<ClassworkResponse> createClasswork(
            @PathVariable UUID classId,
            @RequestBody @Valid ClassworkRequest request
    ) {
        return ApiResponse.<ClassworkResponse>builder()
                .result(classworkService.createClasswork(classId, request))
                .build();
    }

    @GetMapping
    public ApiResponse<java.util.List<ClassworkResponse>> getClassworks(@PathVariable UUID classId) {
        return ApiResponse.<java.util.List<ClassworkResponse>>builder()
                .result(classworkService.getClassworksByClass(classId))
                .build();
    }

    @GetMapping("/{classworkId}")
    public ApiResponse<ClassworkResponse> getClassworkDetail(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId) {
        return ApiResponse.<ClassworkResponse>builder()
                .result(classworkService.getClassworkDetail(classId, classworkId))
                .build();
    }
}