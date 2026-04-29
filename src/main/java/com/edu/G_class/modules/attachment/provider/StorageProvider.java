package com.edu.G_class.modules.attachment.provider;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface StorageProvider {
    Map<String, String> upload(MultipartFile file, String folder);
    void delete(String publicId);
    boolean supports(String contentType);
}
