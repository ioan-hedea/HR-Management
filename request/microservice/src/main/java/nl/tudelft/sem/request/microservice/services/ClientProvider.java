package nl.tudelft.sem.request.microservice.services;

import java.net.URI;
import nl.tudelft.sem.contract.client.ContractClient;
import nl.tudelft.sem.contract.client.ContractClientConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class ClientProvider {
    @Bean
    public ContractClient contractClient(
            @Value("${service.contract.url:http://localhost:8083}") String contractServiceUrl) {
        return new ContractClient(new ContractClientConfiguration(URI.create(contractServiceUrl)));
    }
}
