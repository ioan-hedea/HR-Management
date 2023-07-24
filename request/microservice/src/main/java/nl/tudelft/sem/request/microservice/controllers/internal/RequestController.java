package nl.tudelft.sem.request.microservice.controllers.internal;

import static nl.tudelft.sem.request.commons.ApiData.INTERNAL_PATH;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import javax.validation.Valid;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.request.commons.entities.RequestDto;
import nl.tudelft.sem.request.commons.entities.RequestStatus;
import nl.tudelft.sem.request.microservice.authentication.AuthManager;
import nl.tudelft.sem.request.microservice.database.entities.GeneralRequest;
import nl.tudelft.sem.request.microservice.database.entities.utils.RequestSpecification;
import nl.tudelft.sem.request.microservice.database.repositories.RequestRepository;
import nl.tudelft.sem.request.microservice.exceptions.BadRequestBody;
import nl.tudelft.sem.request.microservice.exceptions.RequestNotFoundException;
import nl.tudelft.sem.request.microservice.services.RequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@Slf4j
@RestController
@RequestMapping(INTERNAL_PATH + "/request")
public class RequestController {

    @NonNull
    private final transient RequestRepository requestRepository;

    private final transient RequestService requestService;
    private final transient AuthManager authManager;


    /**
     * Request Controller Constructor.
     *
     * @param requestRepository Repository for the requests.
     */
    public RequestController(@NonNull RequestRepository requestRepository,
                             RequestService requestService,
                             AuthManager authManager) {
        this.requestRepository = requestRepository;
        this.requestService = requestService;
        this.authManager = authManager;
    }

    /**
     * Create a new request.
     *
     * @param requestDto Information of the request that will be added
     * @return Request that was added
     */
    @PostMapping
    ResponseEntity<RequestDto> createRequest(@RequestBody RequestDto requestDto) {
        LocalDateTime requestDate = requestDto.getRequestDate() != null ? requestDto.getRequestDate() : LocalDateTime.now();
        String author = authManager.getNetId();

        GeneralRequest request = GeneralRequest.builder()
                .id(UUID.randomUUID())
                .status(RequestStatus.OPEN)
                .author(author)
                .contractId(requestDto.getContractId())
                .requestBody(requestDto.getRequestBody())
                .requestDate(requestDate)
                .responseBody(null)
                .responseDate(null)
                .startDate(requestDto.getStartDate())
                .numberOfDays(requestDto.getNumberOfDays())
                .build();
        request = requestRepository.save(request);
        return ResponseEntity.created(URI.create(INTERNAL_PATH + "/request/" + request.getId())).body(request.getDto());
    }

    /**
     * Get request by ID.
     *
     * @param id ID of the request.
     * @return ResponseEntity with the request of the given ID
     */
    @GetMapping("/{id}")
    ResponseEntity<RequestDto> getRequestById(@PathVariable UUID id) {
        return ResponseEntity.ok(requestRepository.findById(id).orElseThrow(RequestNotFoundException::new).getDto());
    }

    /**
     * Get all open requests.
     *
     * @return ResponseEntity with all the requests marked as 'open'.
     */
    @GetMapping("/open")
    ResponseEntity<List<GeneralRequest>> getAllOpenRequests() {
        List<GeneralRequest> requests = requestRepository.findAll(RequestSpecification.hasAttribute(RequestStatus.OPEN));

        return new ResponseEntity<>(requests, HttpStatus.OK);
    }

    /**
     * Reject a request with the given ID.
     *
     * @param id ID of the request to reject.
     * @param responseBody Response body of the rejection.
     * @return ResponseEntity of updated request
     */
    @PutMapping({"/reject/{id}"})
    ResponseEntity<RequestDto> rejectRequest(@PathVariable UUID id, @RequestBody String responseBody) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);
        return ResponseEntity.ok(requestService.rejectRequest(request, responseBody).getDto());
    }

    /**
     * Approve a request with the given ID.
     *
     * @param id ID of the request to approve.
     * @return ResponseEntity of updated request.
     */
    @PutMapping("/approve/{id}")
    ResponseEntity<RequestDto> approveRequest(@PathVariable UUID id) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);

        return ResponseEntity.ok(requestService.approveRequest(request).getDto());
    }

    /**
     * Request to modify the data of a draft contract.
     * The request needs to be approved or rejected by HR.
     *
     * @param id Id of the draft contract.
     * @param modifications Modifications done to the draft contract.
     * @return ResponseEntity of updated request.
     */
    @PostMapping("/contract/{id}")
    ResponseEntity<RequestDto> modifyContract(@PathVariable UUID id,
                                  @Valid @RequestBody ContractModificationDto modifications) {
        GeneralRequest request = requestService.modifyContract(id, modifications).orElseThrow(BadRequestBody::new);

        return ResponseEntity.ok(request.getDto());
    }

    @PutMapping("document/respond/{id}")
    ResponseEntity<RequestDto> addDocument(@PathVariable UUID id,
                                           @Valid @RequestBody String response) {
        GeneralRequest request = requestService.addResponse(id, response).orElseThrow(BadRequestBody::new);

        return ResponseEntity.ok(request.getDto());
    }

    /**
     * Request a document from an employee.
     *
     * @param id The UUID of the employee from which we request the document.
     * @param body The request message describing the document needed.
     * @return ResponseEntity of updated request.
     */
    @PostMapping("/document/{id}")
    ResponseEntity<RequestDto> requestDocument(@PathVariable UUID id,
                                                @RequestBody String body) {
        GeneralRequest request = requestService.addRequestDocument(id, body);

        return ResponseEntity.ok(request.getDto());
    }
}
