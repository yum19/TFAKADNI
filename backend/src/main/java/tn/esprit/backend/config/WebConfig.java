// src/main/java/tn/esprit/backend/config/WebConfig.java
package tn.esprit.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves uploaded files (images, voice, docs) from the local 'uploads/' folder.
 * Files are saved there by MessageController.uploadFile().
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Requests to /uploads/** → served from ./uploads/ folder
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}