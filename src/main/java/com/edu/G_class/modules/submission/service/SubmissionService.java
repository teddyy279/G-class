package com.edu.G_class.modules.submission.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.*;
import com.edu.G_class.enums.Role;
import com.edu.G_class.enums.SubmissionStatus;
import com.edu.G_class.modules.attachment.provider.StorageProvider;
import com.edu.G_class.modules.attachment.repository.AttachmentRepository;
import com.edu.G_class.modules.classroom.repository.ClassMemberRepository;
import com.edu.G_class.modules.classwork.repository.ClassworkRepository;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.submission.dto.request.GradeSubmissionRequest;
import com.edu.G_class.modules.submission.dto.request.TurnInRequest;
import com.edu.G_class.modules.submission.dto.response.SubmissionResponse;
import com.edu.G_class.modules.submission.mapper.SubmissionMapper;
import com.edu.G_class.modules.submission.repository.SubmissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionService {

    SubmissionRepository submissionRepository;
    ClassworkRepository classworkRepository;
    AttachmentRepository attachmentRepository;
    ClassMemberRepository classMemberRepository;
    UserRepository userRepository;
    SubmissionMapper submissionMapper;
    List<StorageProvider> storageProviders;


    @Transactional
    public SubmissionResponse turnIn(UUID classId, UUID classworkId, TurnInRequest request) {
        UUID currentUserId = getCurrentUserId();

        if (!classMemberRepository.existsByIdClassIdAndIdUserIdAndMemberRole(classId, currentUserId, Role.STUDENT)) {
            throw new AppException(ErrorCode.NOT_A_STUDENT);
        }

        Classwork classwork = classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

        User student = userRepository.getReferenceById(currentUserId);

        Submission submission = submissionRepository
                .findByClassworkIdAndStudentId(classworkId, currentUserId)
                .orElse(Submission.builder()
                        .classwork(classwork)
                        .student(student)
                        .status(SubmissionStatus.SUBMITTED)
                        .build());

        // Determine status: LATE if past due date
        SubmissionStatus newStatus = SubmissionStatus.TURNED_IN;
        if (classwork.getDueDate() != null && LocalDateTime.now().isAfter(classwork.getDueDate())) {
            newStatus = SubmissionStatus.LATE;
        }
        submission.setStatus(newStatus);
        submission.setVersion(submission.getVersion() + 1);

        submission = submissionRepository.save(submission);
        final Submission savedSubmission = submission;

        // Link uploaded attachments to this submission
        if (request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            List<Attachment> attachments = attachmentRepository.findAllById(request.attachmentIds());
            attachments.forEach(a -> a.setSubmission(savedSubmission));
            attachmentRepository.saveAll(attachments);
        }

        return submissionMapper.toResponse(submissionRepository.findByClassworkIdAndStudentId(classworkId, currentUserId)
                .orElseThrow());
    }

    @Transactional
    public SubmissionResponse unsubmit(UUID classId, UUID classworkId) {
        UUID currentUserId = getCurrentUserId();

        classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

        Submission submission = submissionRepository
                .findByClassworkIdAndStudentId(classworkId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Delete files from Cloud + DB
        List<Attachment> attachments = new ArrayList<>(submission.getAttachments());
        for (Attachment att : attachments) {
            if (att.getPublicId() != null) {
                deleteFromCloud(att.getPublicId(), att.getContentType());
            }
        }
        attachmentRepository.deleteAll(attachments);
        submission.getAttachments().clear();

        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission = submissionRepository.save(submission);

        return submissionMapper.toResponse(submission);
    }

    /**
     * Teacher grades a student's submission — sets score, feedback, and changes status to RETURNED.
     */
    @Transactional
    public SubmissionResponse grade(UUID classId, UUID classworkId, UUID studentId, GradeSubmissionRequest request) {
        UUID currentUserId = getCurrentUserId();

        // Only teachers can grade
        if (!classMemberRepository.existsByIdClassIdAndIdUserIdAndMemberRole(classId, currentUserId, Role.TEACHER)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

        Submission submission = submissionRepository
                .findByClassworkIdAndStudentId(classworkId, studentId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        submission.setScore(request.score());
        submission.setFeedback(request.feedback());
        submission.setStatus(SubmissionStatus.RETURNED);

        return submissionMapper.toResponse(submissionRepository.save(submission));
    }

    /**
     * Teacher views all submissions for a classwork.
     */
    public List<SubmissionResponse> getSubmissionsByClasswork(UUID classId, UUID classworkId) {
        UUID currentUserId = getCurrentUserId();

        if (!classMemberRepository.existsByIdClassIdAndIdUserIdAndMemberRole(classId, currentUserId, Role.TEACHER)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

        return submissionRepository.findAllByClassworkId(classworkId).stream()
                .map(submissionMapper::toResponse)
                .toList();
    }

    /**
     * Student views their own submission.
     */
    public SubmissionResponse getMySubmission(UUID classId, UUID classworkId) {
        UUID currentUserId = getCurrentUserId();

        classworkRepository.findByIdAndClazzId(classworkId, classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASSWORK_NOT_FOUND));

        Submission submission = submissionRepository
                .findByClassworkIdAndStudentId(classworkId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        return submissionMapper.toResponse(submission);
    }

    private void deleteFromCloud(String publicId, String contentType) {
        try {
            storageProviders.stream()
                    .filter(p -> p.supports(contentType))
                    .findFirst()
                    .ifPresent(p -> p.delete(publicId));
        } catch (Exception e) {
            log.warn(">>> Failed to delete file from cloud storage: publicId={}, error={}", publicId, e.getMessage());
            // Don't throw — DB deletion will still proceed
        }
    }

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
