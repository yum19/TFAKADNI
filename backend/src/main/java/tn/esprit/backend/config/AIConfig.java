package tn.esprit.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class AIConfig {

    @Bean
    public RestClient geminiClient() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(120));

        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    @Bean
    public RestClient ollamaClient() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(120));

        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}
