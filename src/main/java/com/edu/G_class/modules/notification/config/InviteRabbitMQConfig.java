package com.edu.G_class.modules.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.edu.G_class.modules.notification.config.RabbitMQCommonConfig.DLQ_ROUTING_KEY;
import static com.edu.G_class.modules.notification.config.RabbitMQCommonConfig.DLX_EXCHANGE;

@Configuration
public class InviteRabbitMQConfig {
    public static final String INVITE_QUEUE = "invite_notification_queue";
    public static final String INVITE_EXCHANGE = "invite_exchange";
    public static final String INVITE_ROUTING_KEY = "invite_routing_key";

    @Bean
    public Queue inviteQueue() {
        return QueueBuilder.durable(INVITE_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange inviteExchange() {
        return new DirectExchange(INVITE_EXCHANGE);
    }

    @Bean
    public Binding inviteBinding(Queue inviteQueue, DirectExchange inviteExchange) {
        return BindingBuilder.bind(inviteQueue).to(inviteExchange).with(INVITE_ROUTING_KEY);
    }
}