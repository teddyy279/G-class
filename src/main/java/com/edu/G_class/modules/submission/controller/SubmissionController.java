package com.edu.G_class.modules.submission.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.edu.G_class.modules.attachment.service.AttachmentService;
import com.edu.G_class.modules.submission.dto.request.GradeSubmissionRequest;
import com.edu.G_class.modules.submission.dto.request.TurnInRequest;
import com.edu.G_class.modules.submission.dto.response.SubmissionResponse;
import com.edu.G_class.modules.submission.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/class/{classId}/classworks/{classworkId}/submissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionController {

    AttachmentService attachmentService;
    SubmissionService submissionService;


    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentResponse> uploadSubmissionAttachment(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId,
            @RequestParam("file") MultipartFile file) {

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String folderPath = String.format("class_%s/submissions/%s/user_%s", classId, classworkId, userId);

        return ApiResponse.<AttachmentResponse>builder()
                .result(attachmentService.createAttachment(file, folderPath))
                .build();
    }


    @PostMapping("/turn-in")
    public ApiResponse<SubmissionResponse> turnIn(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId,
            @RequestBody @Valid TurnInRequest request) {

        return ApiResponse.<SubmissionResponse>builder()
                .result(submissionService.turnIn(classId, classworkId, request))
                .build();
    }


    @PatchMapping("/unsubmit")
    public ApiResponse<SubmissionResponse> unsubmit(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId) {

        return ApiResponse.<SubmissionResponse>builder()
                .result(submissionService.unsubmit(classId, classworkId))
                .build();
    }


    @PatchMapping("/{studentId}/grade")
    public ApiResponse<SubmissionResponse> grade(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId,
            @PathVariable UUID studentId,
            @RequestBody @Valid GradeSubmissionRequest request) {

        return ApiResponse.<SubmissionResponse>builder()
                .result(submissionService.grade(classId, classworkId, studentId, request))
                .build();
    }


    @GetMapping
    public ApiResponse<List<SubmissionResponse>> getAllSubmissions(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId) {

        return ApiResponse.<List<SubmissionResponse>>builder()
                .result(submissionService.getSubmissionsByClasswork(classId, classworkId))
                .build();
    }


    @GetMapping("/my")
    public ApiResponse<SubmissionResponse> getMySubmission(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId) {

        return ApiResponse.<SubmissionResponse>builder()
                .result(submissionService.getMySubmission(classId, classworkId))
                .build();
    }
}
