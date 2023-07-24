package nl.tudelft.sem.notification.client;


import static nl.tudelft.sem.notification.commons.ApiData.INTERNAL_PATH;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.concurrent.CompletableFuture;
import lombok.Generated;
import lombok.Getter;
import lombok.NonNull;
import lombok.experimental.Accessors;
import nl.tudelft.sem.notification.client.util.NotificationFutureCallback;
import nl.tudelft.sem.notification.commons.entities.utils.Dto;
import org.apache.hc.client5.http.async.methods.SimpleHttpRequest;
import org.apache.hc.client5.http.async.methods.SimpleRequestBuilder;
import org.apache.hc.client5.http.impl.async.CloseableHttpAsyncClient;
import org.apache.hc.client5.http.impl.async.HttpAsyncClients;
import org.apache.hc.core5.http.ContentType;

/**
 * Client to interact with the contract microservice.
 */
public class NotificationClient {
    /**
     * Configuration object received on client construction.
     */
    private final transient NotificationClientConfiguration configuration;
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
    private final NotificationData notification;

    /**
     * Instantiate a new Contract Client.
     *
     * @param configuration the configuration to use.
     */
    public NotificationClient(@NonNull NotificationClientConfiguration configuration) {
        this.configuration = configuration;
        this.mapper = new ObjectMapper();

        this.httpClient = HttpAsyncClients.createDefault();
        this.httpClient.start();

        this.notification = new NotificationData(this);
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
        NotificationFutureCallback<T> callback = new NotificationFutureCallback<>(future, responseType, mapper);
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
    @Generated
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
    @Generated
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
    @Generated
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
    @Generated
    protected <T extends Dto> CompletableFuture<T> delete(String path, Class<T> responseType) {
        SimpleHttpRequest request = SimpleRequestBuilder.delete(buildInternalUri(path)).build();
        return sendRequest(request, responseType);
    }
}
