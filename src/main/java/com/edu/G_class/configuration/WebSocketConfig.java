package com.edu.G_class.configuration;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Value("${spring.rabbitmq.host}")
    String relayHost;

    @Value("${spring.rabbitmq.stomp-port}")
    int stompPort;

    @Value("${spring.rabbitmq.username}")
    String login;

    @Value("${spring.rabbitmq.password}")
    String passCode;

    @Value("${app.websocket.allowed-origins}")
    String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost(relayHost)
                .setRelayPort(stompPort)
                .setClientLogin(login)
                .setClientPasscode(passCode)
                .setSystemLogin(login)
                .setSystemPasscode(passCode);

        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
