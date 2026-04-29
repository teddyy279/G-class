package com.edu.G_class.modules.classroom.service;


import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.ClassMember;
import com.edu.G_class.entity.ClassMemberKey;
import com.edu.G_class.entity.Classes;
import com.edu.G_class.entity.User;
import com.edu.G_class.enums.ClassStatus;
import com.edu.G_class.enums.Role;
import com.edu.G_class.modules.classroom.dto.request.ClassCreateRequest;
import com.edu.G_class.modules.classroom.dto.request.ClassUpdateRequest;
import com.edu.G_class.modules.classroom.dto.response.ClassDetailResponse;
import com.edu.G_class.modules.classroom.dto.response.ClassResponse;
import com.edu.G_class.modules.classroom.dto.response.CreateClassResponse;
import com.edu.G_class.modules.classroom.mapper.ClassMapper;
import com.edu.G_class.modules.classroom.repository.ClassMemberRepository;
import com.edu.G_class.modules.classroom.repository.ClassRepository;
import com.edu.G_class.modules.identity.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class ClassService {
    ClassRepository classRepository;
    ClassMemberRepository classMemberRepository;
    UserRepository userRepository;
    ClassMapper classMapper;

    @Transactional
    public CreateClassResponse createClass(ClassCreateRequest request) {
        User currentUser = getCurrentUser();

        Classes newClass = Classes.builder()
                .name(request.name())
                .description(request.description())
                .section(request.section())
                .classCode(generateClassCode())
                .subject(request.subject())
                .room(request.room())
                .owner(currentUser)
                .build();

        newClass = classRepository.save(newClass);

        ClassMember teacherMember = ClassMember.builder()
                .id(new ClassMemberKey(newClass.getId(), currentUser.getId()))
                .clazz(newClass)
                .user(currentUser)
                .memberRole(Role.TEACHER)
                .joinedAt(LocalDateTime.now())
                .build();

        classMemberRepository.save(teacherMember);

        return classMapper.mapToCreateClassResponse(newClass);
    }

    public List<ClassResponse> getAllMyClass() {
        User user = getCurrentUser();

        return classMemberRepository.findAllClassByUserId(user.getId())
                .stream()
                .map(clazz -> ClassResponse.builder()
                        .id(clazz.getId())
                        .name(clazz.getName())
                        .description(clazz.getDescription())
                        .section(clazz.getSection())
                        .classCode(clazz.getClassCode())
                        .room(clazz.getRoom())
                        .ownerName(clazz.getOwner().getFullName())
                        .ownerAvatar(clazz.getOwner().getAvatar())
                        .ownerId(clazz.getOwner().getId())
                        .build())
                .toList();
    }

    public ClassDetailResponse getClassDetail(UUID classId) {
        User user = getCurrentUser();
        //Check if you are a member
        if(!classMemberRepository.existsById(new ClassMemberKey(classId, user.getId()))) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        Classes clazz = getClassOrThrow(classId);

        return classMapper.mapToClassDetailResponse(clazz);
    }


    @Transactional
    public ClassDetailResponse updateClassInfo(UUID classId, ClassUpdateRequest request) {
        User currentUser = getCurrentUser();
        Classes clazz = getClassOrThrow(classId);

        if (!clazz.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        clazz.setName(request.name());
        clazz.setDescription(request.description());
        clazz.setSubject(request.subject());
        clazz.setRoom(request.room());
        clazz.setSection(request.section());

        return classMapper.mapToClassDetailResponse(clazz);
    }

    @Transactional
    public void archiveClass(UUID classId) {
        User currentUser = getCurrentUser();
        Classes clazz = getClassOrThrow(classId);

        if(!clazz.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        clazz.setStatus(ClassStatus.ARCHIVED);
        classRepository.save(clazz);
    }

    private String generateClassCode() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder code = new StringBuilder();
        Random rnd = new Random();

        for (int i = 0; i < 7; i++) {
            int index = rnd.nextInt(chars.length());
            code.append(chars.charAt(index));
        }
        return code.toString();
    }

    private Classes getClassOrThrow(UUID classId) {
        return classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
    }

    private User getCurrentUser() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    public List<UUID> getTeacherIds(UUID classId) {
        return classMemberRepository.findTeacherIdsByClassId(classId);
    }
}
