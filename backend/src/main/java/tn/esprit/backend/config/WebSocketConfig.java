// src/main/java/tn/esprit/backend/config/WebSocketConfig.java
package tn.esprit.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import tn.esprit.backend.security.JwtService;
import tn.esprit.backend.security.UserDetailsServiceImpl;


@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService             jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("http://localhost:4200", "http://localhost:*", "*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    System.out.println("=== WS CONNECT interceptor fired ===");
                    System.out.println("=== Auth header: " + authHeader);  // will show "Bearer " if empty

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7).trim();
                        System.out.println("=== Token length: " + token.length());

                        if (!token.isEmpty()) {  // ← ADD this guard
                            try {
                                if (jwtService.isTokenValid(token)) {
                                    String email = jwtService.extractEmail(token);
                                    System.out.println("=== WS email: " + email);
                                    if (email != null) {
                                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                                        UsernamePasswordAuthenticationToken auth =
                                                new UsernamePasswordAuthenticationToken(
                                                        userDetails, null, userDetails.getAuthorities());
                                        accessor.setUser(auth);
                                        System.out.println("=== WS principal SET to: " + email);
                                    }
                                }
                            } catch (Exception e) {
                                System.err.println("WS JWT auth failed: " + e.getMessage());
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}