package com.edu.G_class.modules.classwork.service;


import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.Classes;
import com.edu.G_class.entity.Classwork;
import com.edu.G_class.entity.Topic;
import com.edu.G_class.modules.classwork.dto.request.UpdateTopicRequest;
import com.edu.G_class.modules.classwork.dto.response.TopicResponse;
import com.edu.G_class.modules.classwork.mapper.ClassworkMapper;
import com.edu.G_class.modules.classwork.repository.ClassworkRepository;
import com.edu.G_class.modules.classwork.repository.TopicRepository;
import com.edu.G_class.modules.stream.service.PostService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

@Transactional
public class TopicService {
    TopicRepository topicRepository;
    ClassworkRepository classworkRepository;
    PostService postService;
    ClassworkMapper classworkMapper;

    public TopicResponse createTopic(UUID classId, String name) {
        checkTeacherAuthority(classId);

        Topic topic = Topic.builder()
                .name(name)
                .clazz(Classes.builder().id(classId).build())
                .build();

        return classworkMapper.mapToTopicResponse(topicRepository.save(topic));
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> getTopicsByClass(UUID classId) {
        return topicRepository.findAllByClazzId(classId).stream()
                .map(classworkMapper::mapToTopicResponse)
                .toList();
    }

    public TopicResponse updateTopic(UUID classId, UpdateTopicRequest request) {
        try {
            checkTeacherAuthority(classId);

            Topic topic = topicRepository.findByIdAndClazzId(request.topicId(), classId)
                    .orElseThrow(() -> new AppException(ErrorCode.TOPIC_NOT_FOUND));

            topic.setName(request.newName());
            return classworkMapper.mapToTopicResponse(topicRepository.save(topic));
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new AppException(ErrorCode.DATA_OUTDATED);
        }
    }

    public void moveClassworkToTopic(UUID classId, UUID classworkId, UUID topicId) {
        try {
            checkTeacherAuthority(classId);

            Classwork classwork = classworkRepository.findByIdAndClazzId(classworkId, classId)
                    .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

            if (topicId == null) {
                classwork.setTopic(null);
            } else {
                Topic topic = topicRepository.findByIdAndClazzId(topicId, classId)
                        .orElseThrow(() -> new AppException(ErrorCode.TOPIC_NOT_FOUND));

                classwork.setTopic(topic);
            }
            classworkRepository.save(classwork);
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new AppException(ErrorCode.DATA_OUTDATED);
        }
    }


    public void deleteTopic(UUID topicId, UUID classId) {
        try {
            checkTeacherAuthority(classId);

            Topic topic = topicRepository.findByIdAndClazzId(topicId, classId)
                    .orElseThrow(() -> new AppException(ErrorCode.TOPIC_NOT_FOUND));

            if (topic.getClassworks() != null) {
                topic.getClassworks().forEach(classwork -> classwork.setTopic(null));
            }

            topicRepository.delete(topic);
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new AppException(ErrorCode.DATA_OUTDATED);
        }
    }

    private void checkTeacherAuthority(UUID classId) {
        UUID userId = UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());

        if (!postService.checkIsTeacher(classId, userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }
    }
}
