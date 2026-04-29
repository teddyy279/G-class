package com.edu.G_class.modules.attachment.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class GcsConfig {

    @Value("${GCP_CREDENTIALS_JSON:}")
    private String gcpCredentialsJson;

    @Bean
    public Storage storage() throws IOException {
        if (gcpCredentialsJson != null && !gcpCredentialsJson.isBlank()) {
            // Load credentials từ biến môi trường (dùng cho Production)
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(
                            gcpCredentialsJson.getBytes(StandardCharsets.UTF_8)))
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");

            return StorageOptions.newBuilder()
                    .setCredentials(credentials)
                    .build()
                    .getService();
        }
        // Fallback: dùng Application Default Credentials (cho local dev với gcloud CLI)
        return StorageOptions.getDefaultInstance().getService();
    }
}
