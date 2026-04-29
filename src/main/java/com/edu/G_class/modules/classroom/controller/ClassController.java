package com.edu.G_class.modules.classroom.controller;

import com.cloudinary.Api;
import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.classroom.dto.request.ClassCreateRequest;
import com.edu.G_class.modules.classroom.dto.request.ClassUpdateRequest;
import com.edu.G_class.modules.classroom.dto.response.ClassDetailResponse;
import com.edu.G_class.modules.classroom.dto.response.ClassResponse;
import com.edu.G_class.modules.classroom.dto.response.CreateClassResponse;
import com.edu.G_class.modules.classroom.service.ClassService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/class")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class ClassController {
    ClassService classService;

    @PostMapping
    public ApiResponse<CreateClassResponse> createClass(@RequestBody @Valid ClassCreateRequest request) {
        return ApiResponse.<CreateClassResponse>builder()
                .result(classService.createClass(request))
                .build();
    }

    @GetMapping("/my-class")
    public ApiResponse<List<ClassResponse>> getAllMyClass() {
        return ApiResponse.<List<ClassResponse>>builder()
                .result(classService.getAllMyClass())
                .build();
    }

    @GetMapping("/{classId}")
    public ApiResponse<ClassDetailResponse> getClassDetail(@PathVariable UUID classId) {
        return ApiResponse.<ClassDetailResponse>builder()
                .result(classService.getClassDetail(classId))
                .build();
    }

    @PutMapping("/{classId}")
    public ApiResponse<ClassDetailResponse> updateClassInfo(
            @PathVariable UUID classId,
            @RequestBody @Valid ClassUpdateRequest request) {
        return ApiResponse.<ClassDetailResponse>builder()
                .result(classService.updateClassInfo(classId, request))
                .build();
    }

    @PatchMapping("/{classId}/archive")
    public ApiResponse<Void> archiveClass(@PathVariable UUID classId) {
        classService.archiveClass(classId);
        return ApiResponse.<Void>builder()
                .message("Class successfully saved")
                .build();
    }
}
