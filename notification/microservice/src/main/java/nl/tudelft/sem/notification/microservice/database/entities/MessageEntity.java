package nl.tudelft.sem.notification.microservice.database.entities;

import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import nl.tudelft.sem.notification.commons.entities.MessageDto;
import nl.tudelft.sem.notification.commons.entities.MessagePriority;
import nl.tudelft.sem.notification.microservice.database.entities.utils.BaseEntity;
import org.modelmapper.ModelMapper;

@SuppressWarnings("com.haulmont.jpb.LombokEqualsAndHashCodeInspection")
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Getter
@Setter
@ToString
@RequiredArgsConstructor
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class MessageEntity extends BaseEntity<MessageDto> {
    @Column(nullable = false)
    @NonNull
    @NotNull
    private UUID userId;

    @NotNull
    @NotBlank
    @Column(nullable = false)
    private String subject;

    @NotNull
    @NotBlank
    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private boolean sent = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private MessagePriority priority = MessagePriority.LOW;

    @Override
    public MessageDto getDto() {
        return new ModelMapper().map(this, MessageDto.class);
    }

    /**
     * Constructs a new `MessageEntity` instance from a DTO.
     *
     * @param dto the DTO to convert to an entity
     */
    public MessageEntity(MessageDto dto) {
        this.userId = dto.getUserId();
        this.message = dto.getMessage();
        this.sent = dto.isSent();
        this.priority = dto.getPriority();
    }
}
