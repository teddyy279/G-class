package com.edu.G_class.modules.classwork.mapper;

import com.edu.G_class.entity.Classwork;
import com.edu.G_class.entity.Topic;
import com.edu.G_class.modules.classwork.dto.response.ClassworkResponse;
import com.edu.G_class.modules.classwork.dto.response.TopicResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")

public interface ClassworkMapper {
    @Mapping(target = "authorName", source = "author.fullName")
    @Mapping(target = "topicId", source = "topic.id")
    ClassworkResponse toResponse(Classwork classwork);
    TopicResponse mapToTopicResponse(Topic topic);
}
