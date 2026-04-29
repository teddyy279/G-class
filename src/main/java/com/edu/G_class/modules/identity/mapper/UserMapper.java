package com.edu.G_class.modules.identity.mapper;

import com.edu.G_class.entity.User;
import com.edu.G_class.modules.identity.dto.request.UserCreationRequest;
import com.edu.G_class.modules.identity.dto.request.UserUpdateRequest;
import com.edu.G_class.modules.identity.dto.response.UserResponse;
import org.mapstruct.*;


@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    User toUser(UserCreationRequest request);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "createAt", source = "createdAt")
    UserResponse toUserResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
