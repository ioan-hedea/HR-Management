package nl.tudelft.sem.request.microservice.models;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata returned for an uploaded request attachment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestAttachmentDto {
    private UUID id;
    private UUID requestId;
    private String fileName;
    private String contentType;
    private long sizeBytes;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}

