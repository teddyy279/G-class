package com.edu.G_class.modules.attachment.mapper;

import com.edu.G_class.entity.Attachment;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")

public interface AttachmentMapper {
    @Mapping(target = "fileType", source = "contentType")
    @Mapping(target = "thumbernailUrl", source = "thumbnailUrl")
    AttachmentResponse toResponse(Attachment attachment);
}
