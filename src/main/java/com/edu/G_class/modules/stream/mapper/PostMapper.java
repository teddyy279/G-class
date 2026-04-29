package com.edu.G_class.modules.stream.mapper;


import com.edu.G_class.entity.Post;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.edu.G_class.modules.stream.dto.response.PostResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.edu.G_class.modules.attachment.mapper.AttachmentMapper;

@Mapper(componentModel = "spring", uses = AttachmentMapper.class)


public interface PostMapper {
    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", source = "author.fullName")
    @Mapping(target = "authorAvatar", source = "author.avatar")
    PostResponse mapToPostResponse(Post post);

}
