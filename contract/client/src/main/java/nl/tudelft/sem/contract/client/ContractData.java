package nl.tudelft.sem.contract.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import nl.tudelft.sem.contract.commons.entities.ActionSuccessDto;
import nl.tudelft.sem.contract.commons.entities.ContractDto;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;

/**
 * Quasi-client to access only contract related data in the "contracts" microservice.
 */
@RequiredArgsConstructor
public class ContractData {
    private static final String startPath = "/contract/";
    /**
     * Client instance to use (need to access its HTTP client).
     */
    @NonNull
    private final transient ContractClient client;

    /**
     * Get a contract by its ID.
     *
     * @param contractId the contract ID to get.
     * @return a future that will contain the contract.
     */
    public CompletableFuture<ContractDto> getContract(@NonNull UUID contractId) {
        return client.get(startPath + contractId, ContractDto.class);
    }

    public CompletableFuture<ContractDto> addContract(@NonNull ContractDto contractDto)
            throws JsonProcessingException {
        return client.post("/contract", contractDto, ContractDto.class);
    }

    public CompletableFuture<ContractDto> deleteContract(@NonNull UUID contractId) {
        return client.delete(startPath + contractId, ContractDto.class);
    }

    /**
     * Modify an existing contract.
     *
     * @param contract the contract modification DTO.
     * @return a future that will contain the modified contract.
     * @throws JsonProcessingException if the contract could not be serialized.
     */
    public CompletableFuture<ContractDto> modifyContract(@NonNull UUID id, @NonNull ContractModificationDto contract)
            throws JsonProcessingException {
        return client.put("/contract/" + id, contract, ContractDto.class);
    }

    /**
     * Terminate an active contract.
     *
     * @param id the contract ID to terminate.
     * @return a future that will contain the termination result.
     */
    public CompletableFuture<ActionSuccessDto> terminateContract(@NonNull UUID id) {
        return client.delete("/contract/terminate/" + id, ActionSuccessDto.class);
    }
}
