package com.edu.G_class.modules.classroom.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.classroom.dto.request.InviteRequest;
import com.edu.G_class.modules.classroom.dto.request.JoinClassRequest;
import com.edu.G_class.modules.classroom.dto.response.ClassMemberResponse;
import com.edu.G_class.modules.classroom.service.ClassMemberService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/class")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)


public class ClassMemberController {
    ClassMemberService classMemberService;

    @PostMapping("/join")
    public ApiResponse<Void> joinClassByCode(@RequestBody @Valid JoinClassRequest request) {
        classMemberService.joinClassByCode(request);
        return ApiResponse.<Void>builder()
                .message("Successfully join the class!")
                .build();
    }

    @PostMapping("/invite")
    public ApiResponse<Void> sendInvitation(@RequestBody @Valid InviteRequest request) {
        classMemberService.sendInvitation(request);
        return ApiResponse.<Void>builder()
                .message("The invitations have been sent out!")
                .build();
    }

    @PostMapping("/accept-invitation/{token}")
    public ApiResponse<Void> acceptInvitation(@PathVariable UUID token) {
        classMemberService.acceptInvitation(token);
        return ApiResponse.<Void>builder()
                .message("You have successfully joined the class!")
                .build();
    }

    @GetMapping("/{classId}/members")
    public ApiResponse<ClassMemberResponse> getClassMembers(@PathVariable UUID classId) {
        return ApiResponse.<ClassMemberResponse>builder()
                .result(classMemberService.getClassMember(classId))
                .build();
    }

    @DeleteMapping("/{classId}/leave")
    public ApiResponse<Void> leaveClass(@PathVariable UUID classId) {
        classMemberService.leaveClass(classId);
        return ApiResponse.<Void>builder()
                .message("You have left the classroom")
                .build();
    }

    @DeleteMapping("/{classId}/members/{targetUserId}")
    public ApiResponse<Void> removeMember(
            @PathVariable UUID classId,
            @PathVariable UUID targetUserId) {
        classMemberService.removeMember(classId, targetUserId);
        return ApiResponse.<Void>builder()
                .message("The member has been removed from the class")
                .build();
    }
}
