package com.edu.G_class.modules.identity.controller;


import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.identity.dto.request.PasswordChangeRequest;
import com.edu.G_class.modules.identity.dto.request.UserCreationRequest;
import com.edu.G_class.modules.identity.dto.request.UserUpdateRequest;
import com.edu.G_class.modules.identity.dto.response.UserResponse;
import com.edu.G_class.modules.identity.service.UploadService;
import com.edu.G_class.modules.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)


public class UserController {
    UserService userService;
    UploadService uploadService;

    @PostMapping("/create-user")
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request){
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @PostMapping("/avatar")
    public ApiResponse<UserResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<UserResponse>builder()
                .result(uploadService.uploadAvatar(file))
                .build();
    }

    @PostMapping("/update-user")
    public ApiResponse<UserResponse> updateUser(@RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(request))
                .build();
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@RequestBody PasswordChangeRequest request) {
        return ApiResponse.<Void>builder()
                .message("Password changed successfully")
                .build();
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ApiResponse<UserResponse> getUserById(@PathVariable UUID userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(userId))
                .build();
    }
}
