package com.edu.G_class.modules.attachment.repository;

import com.edu.G_class.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findAllByPostIdIn(List<UUID> postIds);
}
