package nl.tudelft.sem.request.microservice.database.repositories;

import java.util.List;
import java.util.UUID;
import nl.tudelft.sem.request.microservice.database.entities.GeneralRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RequestRepository extends JpaRepository<GeneralRequest, UUID>, JpaSpecificationExecutor<GeneralRequest> {
    List<GeneralRequest> findByAuthorOrderByRequestDateDesc(String author);
}
