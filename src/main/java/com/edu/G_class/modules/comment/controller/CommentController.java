package com.edu.G_class.modules.comment.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.enums.CommentType;
import com.edu.G_class.modules.comment.dto.request.CommentRequest;
import com.edu.G_class.modules.comment.dto.response.CommentResponse;
import com.edu.G_class.modules.comment.service.CommentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentController {

    CommentService commentService;

    @GetMapping("/post/{postId}/comments")
    public ApiResponse<List<CommentResponse>> getCommentsByPostId(@PathVariable UUID postId) {
        return ApiResponse.<List<CommentResponse>>builder()
                .result(commentService.getCommentsByPostId(postId))
                .build();
    }

    @PostMapping("/post/{postId}/comments")
    public ApiResponse<CommentResponse> addCommentToPost(
            @PathVariable UUID postId,
            @RequestBody java.util.Map<String, String> payload) {
        // Ensure the request type is POST for stream comments
        CommentRequest enhancedRequest = new CommentRequest(
                payload.get("content"),
                CommentType.POST,
                false,
                null
        );
        return ApiResponse.<CommentResponse>builder()
                .result(commentService.saveAndSendComment(postId, enhancedRequest))
                .build();
    }

    @DeleteMapping("/post/{postId}/comments/{commentId}")
    public ApiResponse<Void> deleteComment(
            @PathVariable UUID postId,
            @PathVariable UUID commentId) {
        commentService.deleteComment(commentId);
        return ApiResponse.<Void>builder()
                .message("Comment deleted successfully")
                .build();
    }



    @GetMapping("/classwork/{classworkId}/comments")
    public ApiResponse<List<CommentResponse>> getClassworkComments(
            @PathVariable UUID classworkId) {
        return ApiResponse.<List<CommentResponse>>builder()
                .result(commentService.getCommentsByClassworkId(classworkId, false))
                .build();
    }

    @GetMapping("/classwork/{classworkId}/private-comments")
    public ApiResponse<List<CommentResponse>> getClassworkPrivateComments(
            @PathVariable UUID classworkId) {
        return ApiResponse.<List<CommentResponse>>builder()
                .result(commentService.getCommentsByClassworkId(classworkId, true))
                .build();
    }

    @PostMapping("/classwork/{classworkId}/comments")
    public ApiResponse<CommentResponse> addClassworkComment(
            @PathVariable UUID classworkId,
            @RequestBody java.util.Map<String, Object> payload) {
        boolean isPrivate = Boolean.TRUE.equals(payload.get("isPrivate"));
        UUID studentId = null;
        if (payload.get("studentId") != null) {
            studentId = UUID.fromString(payload.get("studentId").toString());
        }
        CommentRequest req = new CommentRequest(
                payload.get("content") != null ? payload.get("content").toString() : "",
                CommentType.CLASSWORK,
                isPrivate,
                studentId
        );
        return ApiResponse.<CommentResponse>builder()
                .result(commentService.saveAndSendComment(classworkId, req))
                .build();
    }

    @DeleteMapping("/classwork/{classworkId}/comments/{commentId}")
    public ApiResponse<Void> deleteClassworkComment(
            @PathVariable UUID classworkId,
            @PathVariable UUID commentId) {
        commentService.deleteComment(commentId);
        return ApiResponse.<Void>builder()
                .message("Comment deleted successfully")
                .build();
    }
}
