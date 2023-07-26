package nl.tudelft.sem.request.microservice.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import javax.validation.Valid;
import lombok.NonNull;
import nl.tudelft.sem.contract.client.ContractClient;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.request.commons.entities.RequestStatus;
import nl.tudelft.sem.request.microservice.database.entities.GeneralRequest;
import nl.tudelft.sem.request.microservice.database.repositories.RequestRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;


@Service
public class RequestService {

    private final transient RequestRepository requestRepository;

    private final transient ContractClient contractClient;

    /**
     * Mapper - used to (de)serialize JSON objects.
    */
    private final transient ObjectMapper mapper;

    RequestService(@NonNull RequestRepository requestRepository, ContractClient contractClient) {
        
        this.requestRepository = requestRepository;
        this.contractClient = contractClient;
        mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Reject a request.
     *
     * @param request request to be rejected
     * @param responseBody message that comes along with the rejection
     * @return request with modified attributes
     */
    public GeneralRequest rejectRequest(GeneralRequest request, String responseBody) {
        request.rejectRequest(responseBody);
        requestRepository.save(request);
        return request;
    }

    /**
     * Approve a request.
     *
     * @param request request to be approved
     * @return request with modified attributes
     */
    public GeneralRequest approveRequest(GeneralRequest request) {
        request.approveRequest(contractClient, this);
        requestRepository.save(request);
        return request;
    }

    /**
     *  Stores the modification request in the repository.
     *
     * @param id Id of the draft contract.
     * @param modifications Modifications done to the draft contract.
     * @return The Request Entry
     */
    public Optional<GeneralRequest> modifyContract(@PathVariable UUID id,
                                                   @Valid @RequestBody ContractModificationDto modifications) {
        try {
            GeneralRequest request = GeneralRequest.builder()
                    .id(UUID.randomUUID())
                    .status(RequestStatus.OPEN)
                    .author(SecurityContextHolder.getContext().getAuthentication().getName())
                    .requestBody(id.toString() + ",\n" + mapper.writeValueAsString(modifications))
                    .requestDate(LocalDateTime.now())
                    .responseBody(null)
                    .responseDate(null)
                    .startDate(null)
                    .numberOfDays(0)
                    .build();

            requestRepository.save(request);

            return Optional.of(request);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Add a response to a request.
     *
     * @param id Id of the contract to add response to.
     * @param response Response to the contract.
     * @return The Request Entry
     */
    public Optional<GeneralRequest> addResponse(UUID id, String response) {
        Optional<GeneralRequest> request = requestRepository.findById(id);

        if (request.isEmpty()) {
            return request;
        }

        request.get().setResponseBody(response);
        request.get().setStatus(RequestStatus.APPROVED);

        requestRepository.save(request.get());

        return request;
    }

    /**
     *  Stores the document request in the repository.
     *
     * @param id The UUID of the employee from which we request the documents.
     * @param body Message of the request.
     * @return The Request Entry.
     */
    public GeneralRequest addRequestDocument(UUID id, String body) {
        GeneralRequest request = GeneralRequest.builder()
                .id(UUID.randomUUID())
                .status(RequestStatus.OPEN)
                .author(SecurityContextHolder.getContext().getAuthentication().getName())
                .requestBody(id.toString() + "\n" + body)
                .requestDate(LocalDateTime.now(ZoneId.of("Europe/Amsterdam")))
                .responseBody(null)
                .responseDate(null)
                .startDate(null)
                .numberOfDays(0)
                .build();

        requestRepository.save(request);

        return request;
    }
}
