package com.edu.G_class.modules.comment.controller;

import com.edu.G_class.modules.comment.dto.request.CommentRequest;
import com.edu.G_class.modules.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor

public class CommentWebSocketController {
    private final CommentService commentService;

    @MessageMapping("/comment.{targetId}")
    public void handleComment(@DestinationVariable UUID targetId,
                              @Payload CommentRequest request) {
        commentService.saveAndSendComment(targetId, request);
    }
}
