package com.edu.G_class.modules.attachment.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.Attachment;
import com.edu.G_class.enums.AttachmentType;
import com.edu.G_class.modules.attachment.dto.request.LinkAttachmentRequest;
import com.edu.G_class.modules.attachment.dto.response.AttachmentResponse;
import com.edu.G_class.modules.attachment.mapper.AttachmentMapper;
import com.edu.G_class.modules.attachment.provider.StorageProvider;
import com.edu.G_class.modules.attachment.repository.AttachmentRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class AttachmentService {
    List<StorageProvider> storageProviders;
    AttachmentRepository attachmentRepository;
    AttachmentMapper attachmentMapper;
    RestClient restClient = RestClient.create();


    @Transactional
    public AttachmentResponse createAttachment(MultipartFile file, String folder) {
        String contentType = file.getContentType();

        StorageProvider provider = storageProviders.stream()
                .filter(p -> p.supports(contentType))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.UNSUPPORT_FILE_TYPE));

        Map<String, String> uploadResult = provider.upload(file, folder);

        Attachment attachment = Attachment.builder()
                .fileUrl(uploadResult.get("url"))
                .publicId(uploadResult.get("publicId"))
                .fileName(file.getOriginalFilename())
                .contentType(contentType)
                .attachmentType(AttachmentType.FILE)
                .build();

        return attachmentMapper.toResponse(attachmentRepository.save(attachment));
    }

    @Transactional
    public AttachmentResponse creatLinkAttachment(LinkAttachmentRequest request) {
        AttachmentType type = identifyLinkType(request.url());

        String finalTitle = request.title();

        if (finalTitle == null || finalTitle.isBlank()) {
            if (type == AttachmentType.YOUTUBE) {
                finalTitle = fetchYoutubeTitle(request.url());
            }
            else{
                finalTitle = request.url();
            }
        }

        Attachment attachment = Attachment.builder()
                .fileUrl(request.url())
                .fileName(finalTitle)
                .attachmentType(type)
                .build();

        if (type == AttachmentType.YOUTUBE) {
            attachment.setThumbnailUrl(extractYoutubeThumbnail(request.url()));
        }

        return attachmentMapper.toResponse(attachmentRepository.save(attachment));
    }

    private AttachmentType identifyLinkType(String url) {
        if (url.contains("youtube.com") || url.contains("youtu.be")) return AttachmentType.YOUTUBE;
        if (url.contains("drive.google.com")) return AttachmentType.DRIVE;
        return AttachmentType.LINK;
    }

    private String extractYoutubeThumbnail(String url) {
        String videoId = null;

        if(url.contains("youtu.be/")) {
            // https://youtu.be/VIDEO_ID
            videoId = url.substring(url.lastIndexOf("/") + 1);
        } else if (url.contains("v=")) {
            // https://www.youtube.com/watch?v=VIDEO_ID
            videoId = url.substring(url.indexOf("v=") + 2);
            if (videoId.contains("&")) {
                videoId = videoId.substring(0, videoId.indexOf("&")); //remove excess params
            }
        }

        if(videoId == null || videoId.isBlank()) {
            throw new AppException(ErrorCode.INVALID_YOUTUBE_URL);
        }

        return  "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
    }


    private String fetchYoutubeTitle(String url) {
        try {
            var response = restClient.get()
                    .uri("https://www.youtube.com/oembed?url={url}&format=json", url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("title")) {
                return response.get("title").toString();
            }
        } catch (Exception e) {
            log.error(">>> Unable to retrieve title from YouTube for URL: {}, Error: {}", url, e.getMessage());
        }
        return url;
    }

}
