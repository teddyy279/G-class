package com.edu.G_class.modules.attachment.controller;


import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.entity.Attachment;
import com.edu.G_class.modules.attachment.dto.request.LinkAttachmentRequest;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.edu.G_class.modules.attachment.service.AttachmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/attachments")

public class AttachmentController {
    AttachmentService attachmentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentResponse> uploadFile(
            @RequestParam("file") MultipartFile file) {

        return ApiResponse.<AttachmentResponse>builder()
                .result(attachmentService.createAttachment(file, "general"))
                .build();
    }

    @PostMapping("/link")
    public ApiResponse<AttachmentResponse> createLink(@RequestBody LinkAttachmentRequest request) {
        return ApiResponse.<AttachmentResponse>builder()
                .result(attachmentService.creatLinkAttachment(request))
                .build();
    }
}
