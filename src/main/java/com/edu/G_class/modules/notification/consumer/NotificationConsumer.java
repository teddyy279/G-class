package com.edu.G_class.modules.notification.consumer;

import com.edu.G_class.modules.notification.config.*;
import com.edu.G_class.modules.notification.dto.ClassworkNotificationEvent;
import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import com.edu.G_class.modules.notification.handler.NotificationHandler;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j

public class NotificationConsumer {
    private final List<NotificationHandler> handlers;

    @RabbitListener(queues = OtpRabbitMQConfig.OTP_QUEUE, concurrency = "2-3")
    public void listenOtpQueue(NotificationRequest request) {
        process(request, NotificationType.OTP);
    }

    @RabbitListener(queues = InviteRabbitMQConfig.INVITE_QUEUE, concurrency = "2-3")
    public void ListenInviteQueue(NotificationRequest request) {
        process(request, NotificationType.INVITE);
    }

    @RabbitListener(queues = PostRabbitMQConfig.POST_QUEUE, concurrency = "2-3")
    public void ListenPostQueue(NotificationRequest request) {
        process(request, NotificationType.POST);
    }

    @RabbitListener(queues = ClassworkRabbitMQConfig.CLASSWORK_QUEUE, concurrency = "2-3")
    public void ListenClassworkQueue(ClassworkNotificationEvent event) {
        process(event, NotificationType.CLASSWORK);
    }

    @RabbitListener(queues = CommentRabbitMqConfig.COMMENT_QUEUE, concurrency = "2-3")
    public void ListenCommentQueue(NotificationRequest request) { process(request, NotificationType.COMMENT); }

    private void process(Object request, NotificationType type) {
        handlers.stream()
                .filter(h -> h.supports(type))
                .findFirst()
                .ifPresentOrElse(
                        h -> h.handle(request),
                        () -> log.warn(">>> Handler not found for this type: {}", type)
                );
    }

    @RabbitListener(queues = RabbitMQCommonConfig.DLQ_QUEUE)
    public void processFailedMessages(NotificationRequest request) {
        log.error("Email sent failed completely after 3 attempts: {}", request.to());
    }
}
