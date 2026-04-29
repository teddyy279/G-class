package com.edu.G_class.modules.stream.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.*;
import com.edu.G_class.enums.PostType;
import com.edu.G_class.enums.Role;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.edu.G_class.modules.attachment.repository.AttachmentRepository;
import com.edu.G_class.modules.classroom.repository.ClassMemberRepository;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.producer.NotificationProducer;
import com.edu.G_class.modules.stream.dto.request.PostRequest;
import com.edu.G_class.modules.stream.dto.request.UpdatePostRequest;
import com.edu.G_class.modules.stream.dto.response.PostResponse;
import com.edu.G_class.modules.stream.mapper.PostMapper;
import com.edu.G_class.modules.stream.repository.PostRepository;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)


public class PostService {
    PostRepository postRepository;
    ClassMemberRepository classMemberRepository;
    NotificationProducer notificationProducer;
    PostMapper postMapper;
    UserRepository userRepository;
    AttachmentRepository attachmentRepository;

    @Transactional
    public PostResponse createPost(UUID classId, PostRequest request) {
        UUID userId = getCurrentUserId();
        var Member = classMemberRepository.findById(new ClassMemberKey(classId, userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean isForAll = true;

        List<User> recipientsEntities = null;

        if(Member.getMemberRole() == Role.TEACHER &&
                request.targetStudentIds() != null && !request.targetStudentIds().isEmpty()) {
            isForAll = false;
            recipientsEntities = request.targetStudentIds().stream()
                    .map(userRepository::getReferenceById)
                    .toList();
        }

        List<Attachment> attachments = null;
        if(request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            attachments = request.attachmentIds().stream()
                    .map(attachmentRepository::getReferenceById)
                    .toList();
        }

        Post post = Post.builder()
                .content(request.content())
                .clazz(Classes.builder().id(classId).build())
                .author(User.builder().id(userId).build())
                .attachments(attachments)
                .isForAll(isForAll)
                //.type(PostType.ANNOUNCEMENT)
                .recipients(recipientsEntities)
                .build();


        if(attachments != null) {
            attachments.forEach(a -> a.setPost(post));
        }

        postRepository.save(post);

        notificationProducer.sendPostNotification(classId, post.getId(), post.getContent(), request.targetStudentIds(), userId);

        return postMapper.mapToPostResponse(post);
    }

    @Transactional(readOnly = true)
    public Slice<PostResponse> getStream(UUID classId, int page, int size) {
        UUID currentUserId = getCurrentUserId();
        boolean isTeacher = checkIsTeacher(classId, currentUserId);

        Pageable pageable = PageRequest.of(
                page, size, Sort.by("createdAt").descending()
        );

        Slice<Post> postSlice = postRepository.findStream(classId, currentUserId, isTeacher, pageable);
        List<Post> posts = postSlice.getContent();

        if (!posts.isEmpty()) {
            List<UUID> postIds = posts.stream().map(Post::getId).toList();

            List<Attachment> allAttachments = attachmentRepository.findAllByPostIdIn(postIds);

            Map<UUID, List<Attachment>> attachmentsByPostId = allAttachments.stream()
                    .collect(Collectors.groupingBy(a -> a.getPost().getId()));

            posts.forEach(post -> {
                List<Attachment> postAttachments = attachmentsByPostId.getOrDefault(post.getId(), List.of());
                post.setAttachments(postAttachments);
            });
        }
        return postSlice.map(postMapper::mapToPostResponse);
    }

    @Transactional
    public PostResponse updatePost(UUID classId, UUID postId, UpdatePostRequest request) {
        try {
            Post post = getPost(postId, classId);

            UUID currentUserId = getCurrentUserId();

            boolean isTeacher = checkIsTeacher(classId, currentUserId);
            boolean isOwner = post.getAuthor().getId().equals(currentUserId);

            if (!(isTeacher && isOwner)) {
                throw new AppException(ErrorCode.UNAUTHORIZE);
            }

            if (request.content() != null) {
                post.setContent(request.content());
            }
            if (request.targetStudentIds() != null) {
                if (request.targetStudentIds().isEmpty()) {
                    post.setForAll(true);
                    if (post.getRecipients() != null) {
                        post.getRecipients().clear();
                    }
                } else {
                    post.setForAll(false);
                    List<User> newRecipients = request.targetStudentIds().stream()
                            .map(userRepository::getReferenceById)
                            .toList();

                    post.setRecipients(newRecipients);
                }
            }

            if (request.attachmentIds() != null) {
                if (post.getAttachments() != null) {
                    post.getAttachments().forEach(a -> a.setPost(null));
                }
                List<Attachment> newAttachments = request.attachmentIds().stream()
                        .map(attachmentRepository::getReferenceById)
                        .toList();

                newAttachments.forEach(a -> a.setPost(post));
                post.setAttachments(newAttachments);
            }

            return postMapper.mapToPostResponse(postRepository.save(post));
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new AppException(ErrorCode.DATA_OUTDATED);
        }
    }

    @Transactional
    public void deletePost(UUID classId, UUID postId) {
        Post post = getPost(postId, classId);

        UUID userId = getCurrentUserId();
        boolean isOwner = post.getAuthor().getId().equals(userId);
        boolean isTeacher = checkIsTeacher(classId, userId);

        if(!isOwner && !isTeacher) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        postRepository.delete(post);
    }

    @Transactional
    public void createPostFromClasswork(Classwork classwork, List<UUID> targetStudentIds) {
        String typeLabel = switch(classwork.getClassworkType()) {
            case ASSIGNMENT -> "bài tập";
            case QUESTION -> "câu hỏi";
            case MATERIAL -> "tài liệu";
            case QUIZ -> "bài kiểm tra";
            default -> "nội dung";
        };

        String postContent = "đã đăng một " + typeLabel + " mới: " + classwork.getTitle();

        boolean isForAll = (targetStudentIds == null || targetStudentIds.isEmpty());

        List<User> recipients = isForAll ? null : targetStudentIds.stream()
                .map(userRepository::getReferenceById)
                .toList();

        Post post = Post.builder()
                .content(postContent)
                .clazz(classwork.getClazz())
                .author(classwork.getAuthor())
                .type(PostType.ClASSWORK)
                .targetId(classwork.getId())
                .isForAll(isForAll)
                .recipients(recipients)
                .build();

        postRepository.save(post);
    }


    public boolean checkIsTeacher(UUID classId, UUID userId) {
        return classMemberRepository.existsByIdClassIdAndIdUserIdAndMemberRole(classId, userId, Role.TEACHER);
    }

    public PostResponse getPostById(UUID classId, UUID postId) {
        Post post = getPost(postId, classId);
        List<Attachment> attachments = attachmentRepository.findAllByPostIdIn(List.of(postId));
        post.setAttachments(attachments);
        return postMapper.mapToPostResponse(post);
    }

    private Post getPost(UUID postId, UUID classId) {
        return postRepository.findByIdAndClazzId(postId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
    }

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
