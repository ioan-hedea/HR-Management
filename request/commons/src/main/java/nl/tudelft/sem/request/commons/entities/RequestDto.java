package nl.tudelft.sem.request.commons.entities;

import com.fasterxml.jackson.annotation.JsonView;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import nl.tudelft.sem.request.commons.entities.utils.Dto;
import nl.tudelft.sem.request.commons.entities.utils.Views;

/**
 * Request data transfer object.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonView(Views.Public.class)
public class RequestDto implements Dto {
    /**
     * The ID of the request.
     */
    protected UUID id;

    /**
     * The ID of the contract related to the request.
     */
    protected UUID contractId;

    /**
     * Body of the request.
     */
    private String requestBody;

    /**
     * Date of the Request.
     */
    private LocalDateTime requestDate;

    /**
     * The status of the Request.
     */
    protected RequestStatus requestStatus;

    /**
     * The start date of a vacation/leave request.
     */
    protected LocalDateTime startDate;

    /**
     * Number of days of the vacation/leave request.
     */
    private int numberOfDays;



}
