package nl.tudelft.sem.notification.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import nl.tudelft.sem.notification.commons.entities.MessageCollectionDto;
import nl.tudelft.sem.notification.commons.entities.MessageDto;
import nl.tudelft.sem.notification.commons.entities.UuidCollectionDto;
import nl.tudelft.sem.notification.commons.entities.UuidDto;

/**
 * Quasi-client to access only contract related data in the "contracts" microservice.
 */
@RequiredArgsConstructor
public class NotificationData {
    /**
     * Client instance to use (need to access its HTTP client).
     */
    @NonNull
    private final transient NotificationClient client;

    /**
     * Send a message to a user.
     *
     * @param message the message to send
     * @return a future that will contain the UUID of the message
     * @throws JsonProcessingException if the message could not be serialized
     */
    public CompletableFuture<UuidDto> sendMessage(@NonNull MessageDto message) throws JsonProcessingException {
        return client.post("/notification/send", message, UuidDto.class);
    }

    /**
     * Send multiple messages.
     *
     * @param messages the messages to send
     * @return a future that will contain the UUID of the message
     * @throws JsonProcessingException if the message could not be serialized
     */
    public CompletableFuture<UuidCollectionDto> sendMessages(@NonNull List<@NonNull MessageDto> messages)
            throws JsonProcessingException {
        return client.post("/notification/sendBatch", new MessageCollectionDto(messages), UuidCollectionDto.class);
    }
}
