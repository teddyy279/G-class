package com.edu.G_class.modules.attachment.provider;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import jakarta.persistence.Column;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j

public class GcsStorageProvider implements StorageProvider{
    private final Storage storage;

    @Value("${gcp.bucket-name}")
    private String bucketName;

    @Override
    public boolean supports(String contentType) {
        if(contentType == null) return false;
        return contentType.startsWith("application/pdf") ||
                contentType.contains("word") ||
                contentType.contains("text/");
    }

    @Override
    public Map<String, String> upload(MultipartFile file, String folder) {

        try {
            String fileName = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName) //lưu file ở đâu trong bucket
                    .setContentType(file.getContentType())
                    .build();

            storage.create(blobInfo, file.getBytes()); //upload action

            String url = String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
            //url used for frontend load file, user download

            return Map.of(
                    "url", url,
                    "publicId", fileName
            );
        } catch (IOException exception) {
            log.error(">>> GCS Upload failed: {}", exception.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            BlobId blobId = BlobId.of(bucketName, publicId);
            boolean deleted = storage.delete(blobId);
            if (deleted) {
                log.info(">>> The file has been deleted on GCS {}", publicId);
            }
            else {
                log.warn(">>> No file found to delete on GCS: {}", publicId);
            }
        } catch (Exception exception) {
            log.error(">>> GCS Delete failed: {}", exception.getMessage());
        }
    }
}
