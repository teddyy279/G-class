package com.edu.G_class.modules.classwork.service;


import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.*;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.attachment.repository.AttachmentRepository;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.dto.response.ClassworkResponse;
import com.edu.G_class.modules.classwork.mapper.ClassworkMapper;
import com.edu.G_class.modules.classwork.repository.ClassworkRepository;
import com.edu.G_class.modules.classwork.repository.TopicRepository;
import com.edu.G_class.modules.classwork.strategy.ClassworkHandler;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.producer.NotificationProducer;
import com.edu.G_class.modules.stream.service.PostService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class ClassworkService {
    Map<ClassworkType, ClassworkHandler> handlers;
    ClassworkRepository classworkRepository;
    PostService postService;
    TopicRepository topicRepository;
    ClassworkMapper classworkMapper;
    NotificationProducer notificationProducer;
    AttachmentRepository attachmentRepository;
    UserRepository userRepository;

    public ClassworkService(List<ClassworkHandler> handlerList,
                            ClassworkRepository classworkRepository,
                            PostService postService,
                            TopicRepository topicRepository,
                            ClassworkMapper classworkMapper,
                            NotificationProducer notificationProducer,
                            AttachmentRepository attachmentRepository,
                            UserRepository userRepository) {
        this.classworkRepository = classworkRepository;
        this.postService = postService;
        this.topicRepository = topicRepository;
        this.classworkMapper = classworkMapper;
        this.notificationProducer = notificationProducer;
        this.userRepository = userRepository;
        this.attachmentRepository = attachmentRepository;

        this.handlers = handlerList.stream()
                .collect(Collectors.toMap(ClassworkHandler::getType, h -> h));
    }

    @Transactional
    public ClassworkResponse createClasswork(UUID classId, ClassworkRequest request) {
        UUID currentUserId = getCurrentUserId();

        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if(!postService.checkIsTeacher(classId, currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        Topic topic = null;
        if (request.topicId() != null) {
            topic = topicRepository.findById(request.topicId())
                    .orElseThrow(() -> new AppException(ErrorCode.TOPIC_NOT_FOUND));
            if (!topic.getClazz().getId().equals(classId)) {
                throw new AppException(ErrorCode.INVALID_TOPIC_FOR_CLASS);
            }
        }

        boolean isForAll = true;
        List<User> recipientsEntities = null;
        if (request.targetStudentIds() != null && !request.targetStudentIds().isEmpty()) {
            isForAll = false;
            recipientsEntities = request.targetStudentIds().stream()
                    .map(userRepository::getReferenceById)
                    .toList();
        }

        List<Attachment> attachments = null;
        if (request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            attachments = request.attachmentIds().stream()
                    .map(attachmentRepository::getReferenceById)
                    .toList();
        }

        Classwork classwork = Classwork.builder()
                .title(request.title())
                .description(request.description())
                .classworkType(request.type())
                .clazz(Classes.builder().id(classId).build())
                .author(author)
                .topic(topic)
                .attachments(attachments)
                .isForAll(isForAll)
                .recipients(recipientsEntities)
                .build();

        if (attachments != null) {
            for (Attachment a : attachments) {
                a.setClasswork(classwork);
            }
        }


        ClassworkHandler handler = handlers.get(request.type());
        if (handler != null) {
            handler.handle(classwork, request);
        }


        classwork = classworkRepository.save(classwork);

        postService.createPostFromClasswork(classwork, request.targetStudentIds());

        notificationProducer.sendClassworkNotification(classwork, request.targetStudentIds());

        return classworkMapper.toResponse(classwork);
    }

    public List<ClassworkResponse> getClassworksByClass(UUID classId) {
        return classworkRepository.findAllByClazzId(classId).stream()
                .map(classworkMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ClassworkResponse getClassworkDetail(UUID classId, UUID classworkId) {
        Classwork classwork = classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));
        return classworkMapper.toResponse(classwork);
    }

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

}
