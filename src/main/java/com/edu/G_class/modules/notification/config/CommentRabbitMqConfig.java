package com.edu.G_class.modules.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CommentRabbitMqConfig {
    public static final String COMMENT_EXCHANGE = "comment-notification-exchange";
    public static final String COMMENT_QUEUE = "comment-notification-queue";
    public static final String COMMENT_ROUTING_KEY_PATTERN = "comment.routing.#";

    @Bean
    public TopicExchange commentExchange() {
        return new TopicExchange(COMMENT_EXCHANGE);
    }

    @Bean
    public Queue commentQueue() {
        return new Queue(COMMENT_QUEUE);
    }

    @Bean
    public Binding commentBinding(Queue commentQueue, TopicExchange commentExchange) {
        return BindingBuilder.bind(commentQueue).to(commentExchange).with(COMMENT_ROUTING_KEY_PATTERN);
    }
}
