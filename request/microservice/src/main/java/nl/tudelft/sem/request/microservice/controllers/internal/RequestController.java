package nl.tudelft.sem.request.microservice.controllers.internal;

import static nl.tudelft.sem.request.commons.ApiData.INTERNAL_PATH;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.validation.Valid;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.request.commons.entities.RequestDto;
import nl.tudelft.sem.request.commons.entities.RequestStatus;
import nl.tudelft.sem.request.microservice.authentication.AuthManager;
import nl.tudelft.sem.request.microservice.database.entities.GeneralRequest;
import nl.tudelft.sem.request.microservice.database.entities.RequestAttachment;
import nl.tudelft.sem.request.microservice.database.entities.utils.RequestSpecification;
import nl.tudelft.sem.request.microservice.database.repositories.RequestAttachmentRepository;
import nl.tudelft.sem.request.microservice.database.repositories.RequestRepository;
import nl.tudelft.sem.request.microservice.exceptions.BadRequestBody;
import nl.tudelft.sem.request.microservice.exceptions.RequestNotFoundException;
import nl.tudelft.sem.request.microservice.models.RequestAttachmentDto;
import nl.tudelft.sem.request.microservice.models.RequestUpdateModel;
import nl.tudelft.sem.request.microservice.services.RequestService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@Slf4j
@RestController
@RequestMapping(INTERNAL_PATH + "/request")
public class RequestController {
    private static final long MAX_PDF_BYTES = 10L * 1024L * 1024L;

    @NonNull
    private final transient RequestRepository requestRepository;
    @NonNull
    private final transient RequestAttachmentRepository requestAttachmentRepository;

    private final transient RequestService requestService;
    private final transient AuthManager authManager;


    /**
     * Request Controller Constructor.
     *
     * @param requestRepository Repository for the requests.
     */
    public RequestController(@NonNull RequestRepository requestRepository,
                             @NonNull RequestAttachmentRepository requestAttachmentRepository,
                             RequestService requestService,
                             AuthManager authManager) {
        this.requestRepository = requestRepository;
        this.requestAttachmentRepository = requestAttachmentRepository;
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
    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
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
     * Get all requests created by the currently authenticated user.
     *
     * @return ResponseEntity with all requests for current user, newest first.
     */
    @GetMapping("/mine")
    ResponseEntity<List<RequestDto>> getMyRequests() {
        String author = authManager.getNetId();
        List<RequestDto> requests = requestRepository.findByAuthorOrderByRequestDateDesc(author)
                .stream()
                .map(GeneralRequest::getDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    /**
     * Update an existing OPEN request created by the authenticated user.
     *
     * @param id request identifier
     * @param updateModel payload with fields to update
     * @return updated request
     */
    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    ResponseEntity<RequestDto> updateOwnRequest(@PathVariable UUID id, @RequestBody RequestUpdateModel updateModel) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());
        ensureRequestIsOpen(request);

        if (updateModel == null) {
            throw new BadRequestBody("Please provide fields to update.");
        }

        if (updateModel.getRequestBody() == null
                && updateModel.getContractId() == null
                && updateModel.getStartDate() == null
                && updateModel.getNumberOfDays() == null) {
            throw new BadRequestBody("No editable field provided.");
        }

        if (updateModel.getRequestBody() != null) {
            String nextBody = updateModel.getRequestBody().trim();
            if (nextBody.isEmpty()) {
                throw new BadRequestBody("Request details cannot be empty.");
            }
            request.setRequestBody(nextBody);
        }
        if (updateModel.getContractId() != null) {
            request.setContractId(updateModel.getContractId());
        }
        if (updateModel.getStartDate() != null) {
            request.setStartDate(updateModel.getStartDate());
        }
        if (updateModel.getNumberOfDays() != null) {
            if (updateModel.getNumberOfDays() < 0) {
                throw new BadRequestBody("Number of days must be zero or positive.");
            }
            request.setNumberOfDays(updateModel.getNumberOfDays());
        }

        return ResponseEntity.ok(requestRepository.save(request).getDto());
    }

    /**
     * Delete an existing OPEN request created by the authenticated user.
     *
     * @param id request identifier
     * @return no content response
     */
    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    ResponseEntity<Void> deleteOwnRequest(@PathVariable UUID id) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());
        ensureRequestIsOpen(request);

        requestAttachmentRepository.deleteByRequestId(id);
        requestRepository.delete(request);
        return ResponseEntity.noContent().build();
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

    /**
     * Upload a PDF attachment for a request.
     *
     * @param id request identifier
     * @param file uploaded file
     * @return stored attachment metadata
     */
    @PostMapping(value = "/{id:[0-9a-fA-F\\-]{36}}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<RequestAttachmentDto> uploadAttachment(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());

        if (file == null || file.isEmpty()) {
            throw new BadRequestBody("Please choose a PDF file.");
        }
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new BadRequestBody("PDF file is too large. Maximum size is 10 MB.");
        }

        String fileName = sanitizeFileName(file.getOriginalFilename());
        String contentType = file.getContentType();
        boolean validPdfContentType = contentType != null && "application/pdf".equalsIgnoreCase(contentType);
        boolean validPdfName = fileName.toLowerCase(Locale.ROOT).endsWith(".pdf");
        if (!validPdfContentType && !validPdfName) {
            throw new BadRequestBody("Only PDF attachments are supported.");
        }

        RequestAttachment attachment = requestAttachmentRepository.save(RequestAttachment.builder()
                .requestId(id)
                .fileName(fileName)
                .contentType("application/pdf")
                .sizeBytes(file.getSize())
                .uploadedBy(authManager.getNetId())
                .uploadedAt(LocalDateTime.now())
                .fileData(readFileData(file))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(mapAttachment(attachment));
    }

    /**
     * List all uploaded attachments for a request.
     *
     * @param id request identifier
     * @return list of attachment metadata
     */
    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}/attachments")
    ResponseEntity<List<RequestAttachmentDto>> listAttachments(@PathVariable UUID id) {
        GeneralRequest request = requestRepository.findById(id).orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());

        List<RequestAttachmentDto> attachments = requestAttachmentRepository.findByRequestIdOrderByUploadedAtDesc(id)
                .stream()
                .map(RequestController::mapAttachment)
                .collect(Collectors.toList());

        return ResponseEntity.ok(attachments);
    }

    /**
     * Download a specific attachment.
     *
     * @param attachmentId attachment identifier
     * @return PDF payload
     */
    @GetMapping("/attachments/{attachmentId:[0-9a-fA-F\\-]{36}}")
    ResponseEntity<byte[]> downloadAttachment(@PathVariable UUID attachmentId) {
        RequestAttachment attachment = requestAttachmentRepository.findById(attachmentId)
                .orElseThrow(RequestNotFoundException::new);

        GeneralRequest request = requestRepository.findById(attachment.getRequestId())
                .orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(attachment.getSizeBytes());
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(attachment.getFileName())
                .build());

        return new ResponseEntity<>(attachment.getFileData(), headers, HttpStatus.OK);
    }

    /**
     * Delete one uploaded attachment.
     *
     * @param attachmentId attachment identifier
     * @return no content response
     */
    @DeleteMapping("/attachments/{attachmentId:[0-9a-fA-F\\-]{36}}")
    ResponseEntity<Void> deleteAttachment(@PathVariable UUID attachmentId) {
        RequestAttachment attachment = requestAttachmentRepository.findById(attachmentId)
                .orElseThrow(RequestNotFoundException::new);
        GeneralRequest request = requestRepository.findById(attachment.getRequestId())
                .orElseThrow(RequestNotFoundException::new);
        validateOwnershipForRequest(request, authManager.getNetId());

        requestAttachmentRepository.delete(attachment);
        return ResponseEntity.noContent().build();
    }

    private static String sanitizeFileName(String originalName) {
        if (originalName == null || originalName.trim().isEmpty()) {
            return "document.pdf";
        }

        String normalized = originalName.replace("\\", "/");
        String baseName = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        return baseName.isEmpty() ? "document.pdf" : baseName;
    }

    private static RequestAttachmentDto mapAttachment(RequestAttachment attachment) {
        return RequestAttachmentDto.builder()
                .id(attachment.getId())
                .requestId(attachment.getRequestId())
                .fileName(attachment.getFileName())
                .contentType(attachment.getContentType())
                .sizeBytes(attachment.getSizeBytes())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    private static byte[] readFileData(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestBody("Failed to read uploaded file.");
        }
    }

    private static void ensureRequestIsOpen(GeneralRequest request) {
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new BadRequestBody("Only OPEN requests can be modified.");
        }
    }

    private static void validateOwnershipForRequest(GeneralRequest request, String activeNetId) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(activeNetId);
        if (!isAdmin && !request.getAuthor().equalsIgnoreCase(activeNetId)) {
            throw new BadRequestBody("You can only manage your own requests.");
        }
    }
}
