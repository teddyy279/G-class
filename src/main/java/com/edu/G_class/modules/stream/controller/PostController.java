package com.edu.G_class.modules.stream.controller;

import com.cloudinary.Api;
import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.stream.dto.request.PostRequest;
import com.edu.G_class.modules.stream.dto.request.UpdatePostRequest;
import com.edu.G_class.modules.stream.dto.response.PostResponse;
import com.edu.G_class.modules.stream.service.PostService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Slice;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.edu.G_class.modules.attachment.service.AttachmentService;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/class/")

public class PostController {
    PostService postService;
    AttachmentService attachmentService;

    @PostMapping(value = "/{classId}/post/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentResponse> uploadPostAttachment(
            @PathVariable UUID classId,
            @RequestParam("file") MultipartFile file) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String folderPath = String.format("class_%s/posts/user_%s", classId, userId);
        return ApiResponse.<AttachmentResponse>builder()
                .result(attachmentService.createAttachment(file, folderPath))
                .build();
    }

    @PostMapping("/{classId}/post")
    public ApiResponse<PostResponse> createPost(
            @PathVariable UUID classId,
            @RequestBody @Valid PostRequest request) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.createPost(classId, request))
                .build();
    }

    @GetMapping("/{classId}/post/{postId}")
    public ApiResponse<PostResponse> getPostById(
            @PathVariable UUID classId,
            @PathVariable UUID postId) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.getPostById(classId, postId))
                .build();
    }

    @GetMapping("/{classId}/stream")
    public ApiResponse<Slice<PostResponse>> getStream(
            @PathVariable UUID classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<Slice<PostResponse>>builder()
                .result(postService.getStream(classId, page, size))
                .build();
    }

    @PutMapping("{classId}/post/{postId}")
    public ApiResponse<PostResponse> updatePost(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @RequestBody UpdatePostRequest request) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.updatePost(classId, postId, request))
                .build();
    }

    @DeleteMapping("/{classId}/post/{postId}")
    public ApiResponse<Void> deletePost(
            @PathVariable UUID classId,
            @PathVariable UUID postId){
        postService.deletePost(classId, postId);
        return ApiResponse.<Void>builder()
                .message("The post has been successfully deleted")
                .build();
    }
}
