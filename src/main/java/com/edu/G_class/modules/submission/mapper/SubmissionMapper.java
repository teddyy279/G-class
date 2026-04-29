package com.edu.G_class.modules.submission.mapper;

import com.edu.G_class.entity.Submission;
import com.edu.G_class.modules.attachment.mapper.AttachmentMapper;
import com.edu.G_class.modules.submission.dto.response.SubmissionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {AttachmentMapper.class})
public interface SubmissionMapper {

    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "studentName", source = "student.fullName")
    SubmissionResponse toResponse(Submission submission);
}
