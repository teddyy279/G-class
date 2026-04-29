package com.edu.G_class.modules.comment.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.ClassMember;
import com.edu.G_class.entity.ClassMemberKey;
import com.edu.G_class.entity.Comment;
import com.edu.G_class.entity.User;
import com.edu.G_class.enums.CommentType;
import com.edu.G_class.enums.Role;
import com.edu.G_class.modules.classroom.repository.ClassMemberRepository;
import com.edu.G_class.modules.classroom.service.ClassService;
import com.edu.G_class.modules.classwork.repository.ClassworkRepository;
import com.edu.G_class.modules.comment.dto.request.CommentRequest;
import com.edu.G_class.modules.comment.dto.response.CommentResponse;
import com.edu.G_class.modules.comment.mapper.CommentMapper;
import com.edu.G_class.modules.comment.repository.CommentRepository;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.producer.NotificationProducer;
import com.edu.G_class.modules.stream.repository.PostRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class CommentService {
    CommentRepository commentRepository;
    SimpMessagingTemplate messagingTemplate;
    ClassworkRepository classworkRepository;
    ClassService classService;
    UserRepository userRepository;
    CommentMapper commentMapper;
    PostRepository postRepository;
    ClassMemberRepository classMemberRepository;
    NotificationProducer notificationProducer;

    @Transactional
    public CommentResponse saveAndSendComment(UUID targetId, CommentRequest request) {
        User currentUser = getCurrentUser();

        Comment comment = Comment.builder()
                .content(request.content())
                .author(currentUser)
                .isPrivate(request.isPrivate())
                .build();

        UUID classId;
        if(request.type() == CommentType.POST) {
            var post = postRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
            comment.setPost(post);
            comment.setPrivate(false);
            classId = post.getClazz().getId();
        } else {
            var classwork = classworkRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));
            comment.setClasswork(classwork);
            classId = classwork.getClazz().getId();
        }

        Role roleInClass = getRoleInClass(classId, currentUser.getId());


        if (comment.isPrivate() && roleInClass == Role.TEACHER && request.studentId() != null) {
            boolean isValidStudent = classMemberRepository
                    .existsById(new ClassMemberKey(classId, request.studentId()));
            if (!isValidStudent) throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        commentRepository.save(comment);
        CommentResponse response = commentMapper.mapToCommentResponse(comment);

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        if (!comment.isPrivate()) {
                            messagingTemplate.convertAndSend("/topic/comments." + targetId, response);
                        } else {
                            // sent to myself
                            messagingTemplate.convertAndSendToUser(currentUser.getId().toString(), "/queue/private-comments." + targetId, response);

                            // send to Teachers
                            classService.getTeacherIds(classId).forEach(teacherId -> {
                                if (!teacherId.equals(currentUser.getId())) {
                                    messagingTemplate.convertAndSendToUser(teacherId.toString(), "/queue/private-comments." + targetId, response);
                                }
                            });

                            if (roleInClass == Role.TEACHER && request.studentId() != null) {
                                messagingTemplate.convertAndSendToUser(request.studentId().toString(), "/queue/private-comments." + targetId, response);
                            }
                        }

                        // sent mail/notification by RabbitMQ
                        List<UUID> recipientIds = determineRecipientIds(comment, currentUser, request, roleInClass);
                        notificationProducer.sendCommentNotification(comment, recipientIds);
                    }
                }
        );

        return response;
    }

    private List<UUID> determineRecipientIds(Comment comment, User currentUser, CommentRequest request, Role roleInClass) {
        List<UUID> recipientIds = new ArrayList<>();

        UUID classId = (comment.getPost() != null)
                ? comment.getPost().getClazz().getId()
                : comment.getClasswork().getClazz().getId();

        //  Role roleInclass = getRoleInClass(classId, currentUser.getId());

        if(comment.getPost() != null) {
            //case1: comment on post -> sent to owner post
            UUID postOwnerId = comment.getPost().getAuthor().getId();
            if(!postOwnerId.equals(currentUser.getId())) {
                recipientIds.add(postOwnerId);
            }
        }
        else if (comment.getClasswork() != null) {
            if (comment.isPrivate()) {
                if (roleInClass.equals(Role.TEACHER)
                        && request.studentId() != null) { //Teacher sent to student
                    recipientIds.add(request.studentId());
                }
                //if roleInClass is Student -> need sent to Teacher
                //No need to do anything because the default query in the notification already includes teacher
            }
            else {
                if(roleInClass.equals(Role.TEACHER)) {
                        //teacher reply -> Sent to the students who have previously commented
                    List<UUID> participants = commentRepository.findParticipantIdsByClassworkId(
                        comment.getClasswork().getId());
                    recipientIds.addAll(participants);
                }
                //the students write ->sent to teacher ... the query default already...
            }
        }

        recipientIds.removeIf(id -> id.equals(currentUser.getId()));

        return recipientIds.isEmpty() ? null : recipientIds;
    }

    private Role getRoleInClass(UUID classId, UUID userId) {
        return classMemberRepository.findById(new ClassMemberKey(classId, userId))
                .map(ClassMember::getMemberRole)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private User getCurrentUser() {
        return userRepository.findById(UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    public List<CommentResponse> getCommentsByPostId(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(commentMapper::mapToCommentResponse)
                .toList();
    }

    public List<CommentResponse> getCommentsByClassworkId(UUID classworkId, boolean isPrivate) {
        return commentRepository.findByClassworkIdAndIsPrivateOrderByCreatedAtAsc(classworkId, isPrivate)
                .stream()
                .map(commentMapper::mapToCommentResponse)
                .toList();
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        User currentUser = getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND)); // You can use a generic error if COMMENT_NOT_FOUND doesn't exist, e.g., UNKNOWN_ERROR or add it to ErrorCode

        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        if (!isAuthor) {
            UUID classId = (comment.getPost() != null)
                    ? comment.getPost().getClazz().getId()
                    : comment.getClasswork().getClazz().getId();
            Role role = getRoleInClass(classId, currentUser.getId());
            if (role != Role.TEACHER) {
                throw new AppException(ErrorCode.UNAUTHORIZE);
            }
        }
        commentRepository.delete(comment);
    }
}
