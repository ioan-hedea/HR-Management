package nl.tudelft.sem.request.microservice.database.entities;

import java.time.LocalDateTime;
import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.client.ContractClient;
import nl.tudelft.sem.request.commons.entities.LeaveRequestDto;
import nl.tudelft.sem.request.commons.entities.RequestDto;
import nl.tudelft.sem.request.commons.entities.RequestStatus;
import nl.tudelft.sem.request.commons.entities.VacationRequestDto;
import nl.tudelft.sem.request.microservice.database.entities.utils.BaseEntity;
import nl.tudelft.sem.request.microservice.services.RequestService;
import org.modelmapper.ModelMapper;

@ToString
@AllArgsConstructor
@SuperBuilder
@NoArgsConstructor
@Entity
@Slf4j
public class GeneralRequest extends BaseEntity<RequestDto> {
    /**
     * Status of the request.
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @NotNull
    @Column(nullable = false)
    private String author;

    private UUID contractId;

    @Column(columnDefinition = "TEXT")
    private String requestBody;

    @NotNull
    private LocalDateTime requestDate;

    @Column(columnDefinition = "TEXT")
    private String responseBody;

    private LocalDateTime responseDate;

    private LocalDateTime startDate;

    private int numberOfDays;

    protected GeneralRequest(RequestBuilder<?, ?> b) {
        super(b);
        this.status = b.getStatusForm();
        this.author = b.getAuthorForm();
        this.contractId = b.getContractIdForm();
        this.requestBody = b.getRequestBodyForm();
        this.requestDate = b.getRequestDateForm();
        this.responseBody = b.getResponseBodyForm();
        this.responseDate = b.getResponseDateForm();
        this.startDate = b.getStartDateForm();
        this.numberOfDays = b.getNumberOfDaysForm();
    }

    /**
     * Create a new Request entity.
     *
     * @param requestDto Dto with request details.
     */
    public GeneralRequest(RequestDto requestDto) {

        this.requestBody = requestDto.getRequestBody();
        this.requestDate = requestDto.getRequestDate();
        this.contractId = requestDto.getContractId();

        if (requestDto instanceof VacationRequestDto || requestDto instanceof LeaveRequestDto) {
            this.startDate = requestDto.getStartDate();
            this.numberOfDays = requestDto.getNumberOfDays();

        }

    }

    @Override
    public RequestDto getDto() {
        return new ModelMapper().map(this, RequestDto.class);
    }

    public @NotNull RequestStatus getStatus() {
        return this.status;
    }

    public UUID getContractId() {
        return this.contractId;
    }

    public String getAuthor() {
        return this.author;
    }

    public String getRequestBody() {
        return this.requestBody;
    }

    public LocalDateTime getRequestDate() {
        return this.requestDate;
    }

    public LocalDateTime getStartDate() {
        return this.startDate;
    }

    public String getResponseBody() {
        return this.responseBody;
    }

    public int getNumberOfDays() {
        return this.numberOfDays;
    }

    public void setStatus(@NotNull RequestStatus status) {
        this.status = status;
    }

    public void setContractId(UUID contractId) {
        this.contractId = contractId;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public void setResponseDate(LocalDateTime responseDate) {
        this.responseDate = responseDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public void setNumberOfDays(int numberOfDays) {
        this.numberOfDays = numberOfDays;
    }

    public void approveRequest(ContractClient contractClient, RequestService requestService) {
        log.info("Request Approved");
        this.status = RequestStatus.APPROVED;
    }

    /**
     * Reject the request.
     *
     * @param reason Reason for rejecting the request.
     */
    public void rejectRequest(String reason) {
        log.info("Request rejected");
        this.status = RequestStatus.REJECTED;
        this.setResponseBody(reason);
        this.setResponseDate(LocalDateTime.now());
    }
}
