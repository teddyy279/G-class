package com.edu.G_class.modules.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration

public class PostRabbitMQConfig {
    public static final String POST_EXCHANGE = "post-notification-exchange";
    public static final String POST_QUEUE = "post-notification-queue";
    public static final String POST_ROUTING_KEY = "notification.post.#";

    @Bean
    public TopicExchange postExchange() {
        return new TopicExchange(POST_EXCHANGE);
    }

    @Bean
    public Queue postQueue() {
        return new Queue(POST_QUEUE);
    }

    @Bean
    public Binding postBinding(Queue postQueue, TopicExchange postExchange) {
        return BindingBuilder.bind(postQueue).to(postExchange).with(POST_ROUTING_KEY);
    }
}
