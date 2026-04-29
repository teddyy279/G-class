package com.edu.G_class.modules.comment.mapper;

import com.edu.G_class.entity.Comment;
import com.edu.G_class.modules.comment.dto.response.CommentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")


public interface CommentMapper {
    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", source = "author.fullName")
    @Mapping(target = "isPrivate", source = "private")
    CommentResponse mapToCommentResponse(Comment comment);
}
