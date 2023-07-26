package nl.tudelft.sem.request.microservice.database.repositories;

import java.util.List;
import java.util.UUID;
import nl.tudelft.sem.request.microservice.database.entities.RequestAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestAttachmentRepository extends JpaRepository<RequestAttachment, UUID> {
    List<RequestAttachment> findByRequestIdOrderByUploadedAtDesc(UUID requestId);

    void deleteByRequestId(UUID requestId);
}
