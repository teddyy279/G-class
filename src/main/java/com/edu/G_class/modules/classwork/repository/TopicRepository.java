package com.edu.G_class.modules.classwork.repository;

import com.edu.G_class.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {
    Optional<Topic> findByIdAndClazzId(UUID topicId, UUID classId);
    List<Topic> findAllByClazzId(UUID classId);
}
