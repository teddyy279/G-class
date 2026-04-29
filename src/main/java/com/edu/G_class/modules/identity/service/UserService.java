package com.edu.G_class.modules.identity.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.User;
import com.edu.G_class.modules.identity.dto.request.PasswordChangeRequest;
import com.edu.G_class.modules.identity.dto.request.UserCreationRequest;
import com.edu.G_class.modules.identity.dto.request.UserUpdateRequest;
import com.edu.G_class.modules.identity.dto.response.UserResponse;
import com.edu.G_class.modules.identity.mapper.UserMapper;
import com.edu.G_class.modules.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)


public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    public UserResponse createUser(UserCreationRequest request){
        User user = userMapper.toUser(request);

        user.setPassword(passwordEncoder.encode(request.password()));

        user.setAuthProvider("LOCAL");

        try {
            userRepository.save(user);
        } catch(DataIntegrityViolationException exception) {
            Throwable cause = exception.getCause();
            if(cause instanceof ConstraintViolationException ex){
                String constraintName = ex.getConstraintName();

                if("users_username_key".equals(constraintName)) {
                    throw new AppException(ErrorCode.USER_EXISTED);
                }

                if("users_email_key".equals(constraintName)){
                    throw new AppException(ErrorCode.EMAIL_EXISTED);
                }
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        return userMapper.toUserResponse(user);
    }

    public UserResponse getMyInfo() {
        User user = getCurrentUserEntity();

        return userMapper.toUserResponse(user);
    }


    public UserResponse updateUser(UserUpdateRequest request) {
        User user = getCurrentUserEntity();

        userMapper.updateUser(user, request);

        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public void changePassword(PasswordChangeRequest request) {
        User user = getCurrentUserEntity();

        if(!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public UserResponse getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private User getCurrentUserEntity(){
        var context = SecurityContextHolder.getContext();
        String userId = context.getAuthentication().getName();

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return user;
    }
}
