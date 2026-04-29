package com.edu.G_class.modules.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.edu.G_class.modules.notification.config.RabbitMQCommonConfig.DLQ_ROUTING_KEY;
import static com.edu.G_class.modules.notification.config.RabbitMQCommonConfig.DLX_EXCHANGE;

@Configuration

public class OtpRabbitMQConfig {
    public static final String OTP_QUEUE = "otp_queue";
    public static final String OTP_EXCHANGE = "otp_exchange";
    public static final String OTP_ROUTING_KEY = "otp_routing_key";

    @Bean
    public Queue otpQueue() {
        return QueueBuilder.durable(OTP_QUEUE) //tạo queue chính để lưu loại otp
                //khi lỗi cần retry
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE) // Cấu hình: "Nếu tin nhắn chết, hãy đẩy sang Exchange này"
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY) // Cấu hình: "Khi đẩy sang DLX, hãy dán cái nhãn này vào"
                .build();
    }

    @Bean
    public DirectExchange otpExchange() {
        return new DirectExchange(OTP_EXCHANGE);
    }


    @Bean
    public Binding binding(Queue otpQueue, DirectExchange otpExchange) {
        return BindingBuilder.bind(otpQueue).to(otpExchange).with(OTP_ROUTING_KEY);
    }
}
