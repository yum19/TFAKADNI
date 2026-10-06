package tn.esprit.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Enables asynchronous execution for @Async methods.
 * PostServiceImpl.analyseAsync() uses this pool so ML calls
 * never block the HTTP response thread.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "mlTaskExecutor")
    public Executor mlTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ml-analysis-");
        executor.initialize();
        return executor;
    }
}