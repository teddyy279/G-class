package com.edu.G_class.modules.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClassworkRabbitMQConfig {
    public static final String CLASSWORK_EXCHANGE = "classwork-notification-exchange";
    public static final String CLASSWORK_QUEUE = "classwork-notification-queue";
    public static final String CLASSWORK_ROUTING_KEY_PATTERN = "notification.classwork.#";

    @Bean
    public TopicExchange classworkExchange() {
        return new TopicExchange(CLASSWORK_EXCHANGE);
    }

    @Bean
    public Queue classworkQueue() {
        return new Queue(CLASSWORK_QUEUE);
    }

    @Bean
    public Binding classworkBinding(Queue classworkQueue, TopicExchange classworkExchange) {
        return BindingBuilder.bind(classworkQueue).to(classworkExchange).with(CLASSWORK_ROUTING_KEY_PATTERN);
    }
}
