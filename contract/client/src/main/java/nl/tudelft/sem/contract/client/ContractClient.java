package nl.tudelft.sem.contract.client;


import static nl.tudelft.sem.contract.commons.ApiData.INTERNAL_PATH;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.net.URI;
import java.util.concurrent.CompletableFuture;
import lombok.Getter;
import lombok.NonNull;
import lombok.experimental.Accessors;
import nl.tudelft.sem.contract.client.util.ContractFutureCallback;
import nl.tudelft.sem.contract.commons.entities.utils.Dto;
import org.apache.hc.client5.http.async.methods.SimpleHttpRequest;
import org.apache.hc.client5.http.async.methods.SimpleRequestBuilder;
import org.apache.hc.client5.http.impl.async.CloseableHttpAsyncClient;
import org.apache.hc.client5.http.impl.async.HttpAsyncClients;
import org.apache.hc.core5.http.ContentType;

/**
 * Client to interact with the contract microservice.
 */
public class ContractClient {
    /**
     * Configuration object received on client construction.
     */
    private final transient ContractClientConfiguration configuration;
    /**
     * The HTTP client.
     */
    private final transient CloseableHttpAsyncClient httpClient;
    /**
     * Mapper - used to (de)serialize JSON objects.
     */
    private final transient ObjectMapper mapper;

    /**
     * Interface for the contract-related data.
     */
    @Accessors(fluent = true)
    @Getter
    private final ContractData contract;

    @Accessors(fluent = true)
    @Getter
    private final SalaryScaleData salaryScale;

    /**
     * Interface for job-position related data.
     */
    @Accessors(fluent = true)
    @Getter
    private final JobPositionData jobPosition;

    /**
     * Interface for pension-scheme related data.
     */
    @Accessors(fluent = true)
    @Getter
    private final PensionSchemeData pensionScheme;

    /**
     * Instantiate a new Contract Client.
     *
     * @param configuration the configuration to use.
     */
    public ContractClient(@NonNull ContractClientConfiguration configuration) {
        this.configuration = configuration;
        this.mapper = new ObjectMapper().registerModules(new Jdk8Module(), new JavaTimeModule());

        this.httpClient = HttpAsyncClients.createDefault();
        this.httpClient.start();

        this.contract = new ContractData(this);
        this.salaryScale = new SalaryScaleData(this);
        this.jobPosition = new JobPositionData(this);
        this.pensionScheme = new PensionSchemeData(this);
    }

    /**
     * Construct a URI for an internal request.
     *
     * @param path the path to send the request to.
     * @return constructed URI, with the base URI and the path.
     */
    private @NonNull URI buildInternalUri(String path) {
        return this.configuration.getBaseUri().resolve(INTERNAL_PATH + path);
    }

    /**
     * Send an HTTP request asynchronously.
     *
     * @param request the request to send.
     * @param responseType the type of response to expect.
     * @param <T> the type of response to expect.
     * @return a future containing the response.
     */
    private <T extends Dto> CompletableFuture<T> sendRequest(SimpleHttpRequest request, Class<T> responseType) {
        CompletableFuture<T> future = new CompletableFuture<>();
        ContractFutureCallback<T> callback = new ContractFutureCallback<>(future, responseType, mapper);
        this.httpClient.execute(request, callback);
        return future;
    }

    /**
     * Send a GET request to the server.
     *
     * @param path the path to send the request to.
     * @param responseType the type of response to expect.
     * @param <T> the type of response to expect.
     * @return a future containing the response.
     */
    protected <T extends Dto> CompletableFuture<T> get(String path, Class<T> responseType) {
        SimpleHttpRequest request = SimpleRequestBuilder.get(buildInternalUri(path)).build();
        return sendRequest(request, responseType);
    }

    /**
     * Send a POST request to the server.
     *
     * @param path the path to send the request to.
     * @param body the body to send
     * @param responseType the type of response to expect
     * @param <T> the type of response to expect
     * @param <U> the type of body to send
     * @return a future that will contain the response
     * @throws JsonProcessingException if the body could not be serialized.
     */
    protected <T extends Dto, U extends Dto> CompletableFuture<T> post(String path, U body, Class<T> responseType)
            throws JsonProcessingException {
        SimpleHttpRequest request = SimpleRequestBuilder.post(buildInternalUri(path))
                .setBody(mapper.writeValueAsString(body), ContentType.APPLICATION_JSON)
                .build();
        return sendRequest(request, responseType);
    }

    /**
     * Send a PUT request to the server.
     *
     * @param path the path to send the request to.
     * @param body the body to send
     * @param responseType the type of response to expect
     * @param <T> the type of response to expect
     * @param <U> the type of body to send
     * @return a future that will contain the response
     * @throws JsonProcessingException if the body could not be serialized.
     */
    protected <T extends Dto, U extends Dto> CompletableFuture<T> put(String path, U body, Class<T> responseType)
            throws JsonProcessingException {
        SimpleHttpRequest request = SimpleRequestBuilder.put(buildInternalUri(path))
                .setBody(mapper.writeValueAsString(body), ContentType.APPLICATION_JSON)
                .build();
        return sendRequest(request, responseType);
    }

    /**
     * Send a DELETE request to the server.
     *
     * @param path the path to send the request to.
     * @param responseType the type of response to expect
     * @param <T> the type of response to expect
     * @return a future that will contain the response
     */
    protected <T extends Dto> CompletableFuture<T> delete(String path, Class<T> responseType) {
        SimpleHttpRequest request = SimpleRequestBuilder.delete(buildInternalUri(path)).build();
        return sendRequest(request, responseType);
    }
}
