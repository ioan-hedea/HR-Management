package nl.tudelft.sem.request.microservice.models;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload used to update editable fields of an existing request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestUpdateModel {
    private UUID contractId;
    private String requestBody;
    private LocalDateTime startDate;
    private Integer numberOfDays;
}

