package nl.tudelft.sem.template.authentication.domain.providers.implementations;

import java.net.URI;
import nl.tudelft.sem.user.client.UserClient;
import nl.tudelft.sem.user.client.UserClientConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class ClientProvider {
    private final transient String userServiceUrl;

    public ClientProvider(@Value("${service.user.url:http://localhost:8082}") String userServiceUrl) {
        this.userServiceUrl = userServiceUrl;
    }

    @Bean
    public UserClient userClient() {
        return new UserClient(new UserClientConfiguration(URI.create(userServiceUrl)));
    }
}
