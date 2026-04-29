package com.edu.G_class.modules.attachment.provider;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j


public class CloudinaryStorageProvider implements StorageProvider{
    private final Cloudinary cloudinary;

    @Override
    public boolean supports(String contentType) {
        return contentType != null && (
                contentType.startsWith("image/")
        );
    }

    @Override
    public Map<String, String> upload (MultipartFile file, String folder) {
        try {
            Map<String, String> options = ObjectUtils.asMap("folder", folder);
            var result = cloudinary.uploader().upload(file.getBytes(), options);

            return Map.of("url", result.get("secure_url").toString(),
                          "publicId", result.get("public_id").toString()
            );
        } catch (IOException exception) {
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException exception) {
            log.error(">>> Cloudinary delete failed for ID: {}", publicId);
        }
    }

}
