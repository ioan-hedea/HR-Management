package nl.tudelft.sem.contract.microservice.services;

import java.net.URI;
import nl.tudelft.sem.notification.client.NotificationClient;
import nl.tudelft.sem.notification.client.NotificationClientConfiguration;
import nl.tudelft.sem.user.client.UserClient;
import nl.tudelft.sem.user.client.UserClientConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class ClientProvider {
    /**
     * Build a new notification client.
     *
     * @return a notification client.
     */
    @Bean
    public NotificationClient getNotificationClient(
            @Value("${service.notification.url:http://localhost:8085}") String notificationServiceUrl) {
        return new NotificationClient(NotificationClientConfiguration.builder()
                .baseUri(URI.create(notificationServiceUrl))
                .build());
    }

    @Bean
    public UserClient userClient(@Value("${service.user.url:http://localhost:8082}") String userServiceUrl) {
        return new UserClient(new UserClientConfiguration(URI.create(userServiceUrl)));
    }
}
