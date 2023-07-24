package nl.tudelft.sem.notification.microservice.controllers;


import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.notification.commons.entities.MessageCollectionDto;
import nl.tudelft.sem.notification.commons.entities.MessageDto;
import nl.tudelft.sem.notification.commons.entities.UuidCollectionDto;
import nl.tudelft.sem.notification.commons.entities.UuidDto;
import nl.tudelft.sem.notification.microservice.services.MessageDispatcher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequestMapping("/internal/notification")
@RestController
public class NotificationController {
    private final transient MessageDispatcher messageDispatcher;

    public NotificationController(MessageDispatcher messageDispatcher) {
        this.messageDispatcher = messageDispatcher;
    }

    @PostMapping("/send")
    ResponseEntity<UuidDto> send(@Valid @RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(new UuidDto(messageDispatcher.addMessageToQueue(messageDto)));
    }

    @PostMapping("/sendBatch")
    ResponseEntity<UuidCollectionDto> sendAll(@RequestBody MessageCollectionDto messagesDto) {
        return ResponseEntity.ok(new UuidCollectionDto(messageDispatcher.addMessagesToQueue(messagesDto.getMessages())));
    }
}
