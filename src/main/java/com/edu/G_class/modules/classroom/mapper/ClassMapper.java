package com.edu.G_class.modules.classroom.mapper;

import com.edu.G_class.entity.Classes;
import com.edu.G_class.modules.classroom.dto.response.ClassDetailResponse;
import com.edu.G_class.modules.classroom.dto.response.ClassResponse;
import com.edu.G_class.modules.classroom.dto.response.CreateClassResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")

public interface ClassMapper {
    @Mapping(source = "owner.fullName", target = "ownerName")
    @Mapping(source = "owner.avatar", target = "ownerAvatar")
    CreateClassResponse mapToCreateClassResponse(Classes classes);


    @Mapping(source = "owner.id", target = "ownerId")
    ClassDetailResponse mapToClassDetailResponse(Classes classes);
}
