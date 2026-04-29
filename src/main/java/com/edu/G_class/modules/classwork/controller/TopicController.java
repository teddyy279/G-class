package com.edu.G_class.modules.classwork.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.classwork.dto.request.CreateTopicRequest;
import com.edu.G_class.modules.classwork.dto.request.UpdateTopicRequest;
import com.edu.G_class.modules.classwork.dto.response.TopicResponse;
import com.edu.G_class.modules.classwork.service.TopicService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/class/{classId}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class TopicController {
    TopicService topicService;

    @PostMapping("/topics")
    public ApiResponse<TopicResponse> createTopic(
            @PathVariable UUID classId,
            @RequestBody @Valid CreateTopicRequest request) {
        return ApiResponse.<TopicResponse>builder()
                .result(topicService.createTopic(classId, request.name()))
                .build();
    }

    @GetMapping("/topics")
    public ApiResponse<List<TopicResponse>> getTopics(@PathVariable UUID classId) {
        return ApiResponse.<List<TopicResponse>>builder()
                .result(topicService.getTopicsByClass(classId))
                .build();
    }

    @PutMapping("/topics")
    public ApiResponse<TopicResponse> updateTopic(
            @PathVariable UUID classId,
            @RequestBody @Valid UpdateTopicRequest request) {
        return ApiResponse.<TopicResponse>builder()
                .result(topicService.updateTopic(classId, request))
                .build();
    }

    @PatchMapping("/classworks/{classworkId}/topic")
    public ApiResponse<Void> moveClassworkToTopic(
            @PathVariable UUID classId,
            @PathVariable UUID classworkId,
            @RequestParam(required = false) UUID topicId) {
        topicService.moveClassworkToTopic(classId, classworkId, topicId);
        return ApiResponse.<Void>builder()
                .message("The classwork has been moved to the new topic")
                .build();
    }

    @DeleteMapping("/topics/{topicId}")
    public ApiResponse<Void> deleteTopic(
            @PathVariable UUID classId,
            @PathVariable UUID topicId) {
        topicService.deleteTopic(topicId, classId);
        return ApiResponse.<Void>builder()
                .message("The topic has been deleted")
                .build();
    }
}
