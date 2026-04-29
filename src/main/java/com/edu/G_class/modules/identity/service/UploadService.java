package com.edu.G_class.modules.identity.service;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.User;
import com.edu.G_class.modules.identity.dto.response.UserResponse;
import com.edu.G_class.modules.identity.mapper.UserMapper;
import com.edu.G_class.modules.identity.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j


public class UploadService {
    Cloudinary cloudinary;
    UserRepository userRepository;
    UserMapper userMapper;


    @Transactional
    @SuppressWarnings("unchecked")
    public UserResponse uploadAvatar(MultipartFile file) {
        if(file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_IS_EMPTY);
        }

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        try {
            if(user.getAvatarPublicId() != null) {
                cloudinary.uploader().destroy(user.getAvatarPublicId(), ObjectUtils.emptyMap());
                log.info(">>> Old photos have been successfully deleted: {}", user.getAvatarPublicId());
            }
            // 2. Cấu hình các tham số khi upload (Tự động nén, cắt hình vuông 200x200)
            // c_thumb, g_face: Tự động tìm mặt người và cắt thành hình tròn/vuông.
            // f_auto, q_auto: Tự động tối ưu định dạng ảnh và chất lượng.
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", "g-class/avatars",
                    "transformation", "c_thumb,g_face,w_200,h_200,r_max,f_auto,q_auto"
            );

            var uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            String newUrl = uploadResult.get("secure_url").toString();
            String newPublicId = uploadResult.get("public_id").toString();

            user.setAvatar(newUrl);
            user.setAvatarPublicId(newPublicId);

            return userMapper.toUserResponse(user);
        } catch(IOException ex){
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }
}
