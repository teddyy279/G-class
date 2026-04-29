package com.edu.G_class.modules.notification.producer;


import com.edu.G_class.entity.Classwork;
import com.edu.G_class.entity.Comment;
import com.edu.G_class.modules.notification.config.*;
import com.edu.G_class.modules.notification.dto.ClassworkNotificationEvent;
import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j


public class NotificationProducer {
    private final RabbitTemplate rabbitTemplate;

    public void sendOtpMessage(NotificationRequest request) {
        send(OtpRabbitMQConfig.OTP_EXCHANGE, OtpRabbitMQConfig.OTP_ROUTING_KEY, request, "OTP");
    }

    public void sendInviteMessage(NotificationRequest request) {
        send(InviteRabbitMQConfig.INVITE_EXCHANGE, InviteRabbitMQConfig.INVITE_ROUTING_KEY, request, "INVITE");
    }

    public void sendPostNotification(UUID classId, UUID postId, String content, List<UUID> recipientIds, UUID userId) {
        NotificationRequest request = NotificationRequest.builder()
                .classId(classId)
                .postId(postId)
                .authorId(userId)
                .recipientIds(recipientIds)
                .body(content)
                .build();

        String routingKey = "notification.post." + classId;

        send(PostRabbitMQConfig.POST_EXCHANGE, routingKey, request, "POST");
    }

    public void sendClassworkNotification(Classwork classwork, List<UUID> targetStudentIds) {
        var event = ClassworkNotificationEvent.builder()
                .classId(classwork.getClazz().getId())
                .classworkId(classwork.getId())
                .title(classwork.getTitle())
                .authorName(classwork.getAuthor().getFullName())
                .type(classwork.getClassworkType())
                .targetStudentIds(targetStudentIds)
                .build();

        String routingKey = "notification.classwork." + classwork.getClazz().getId();

        log.info(">>> [Producer] Pushing CLASSWORK notification for {} into RabbitMQ...", event.title());
        try {
            rabbitTemplate.convertAndSend(
                    ClassworkRabbitMQConfig.CLASSWORK_EXCHANGE,
                    routingKey,
                    event);
        } catch (Exception exception) {
            log.error(">>> [Producer] Error pushing CLASSWORK notification: {}", exception.getMessage());
        }

    }

    public void sendCommentNotification(Comment comment, List<UUID> targetStudentIds) {
        NotificationRequest request = NotificationRequest.builder()
                .classId(comment.getPost() != null ?
                        comment.getPost().getClazz().getId() :
                        comment.getClasswork().getClazz().getId())
                .postId(comment.getPost() != null ? comment.getPost().getId() : null)
                .classworkId(comment.getClasswork() != null ? comment.getClasswork().getId() : null)
                .authorId(comment.getAuthor().getId())
                .recipientIds(targetStudentIds)
                .body(comment.getContent())
                .build();

        String routingKey = "comment.routing." + request.classId();

        send(CommentRabbitMqConfig.COMMENT_EXCHANGE, routingKey, request, "Comment");
    }

    private void send(String exchange, String routingKey, NotificationRequest request, String typeLabel) {
        //log.info(">>> [Producer] Pushing request {} for {} into RabbitMQ...", typeLabel, request.to());
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, request);
        } catch (Exception exception) {
            log.error(">>> [Producer] Error pushing message {} into Queue: {}", typeLabel, exception.getMessage());
        }
    }
}
