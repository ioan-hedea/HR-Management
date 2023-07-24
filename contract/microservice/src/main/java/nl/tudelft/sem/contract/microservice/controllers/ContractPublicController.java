package nl.tudelft.sem.contract.microservice.controllers;

import java.net.URI;
import java.util.UUID;
import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.commons.entities.ContractDto;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.contract.microservice.database.entities.Contract;
import nl.tudelft.sem.contract.microservice.database.repositories.ContractRepository;
import nl.tudelft.sem.contract.microservice.exceptions.ActionNotAllowedException;
import nl.tudelft.sem.contract.microservice.exceptions.ContractNotFoundException;
import nl.tudelft.sem.contract.microservice.services.ContractService;
import nl.tudelft.sem.contract.microservice.services.RoleAuthenticationService;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publicly accessible contract controller.
 */
@Slf4j
@RestController
@RequestMapping("/contract")
public class ContractPublicController {
    private final transient ContractRepository contractRepository;
    private final transient ContractService contractService;
    private final transient RoleAuthenticationService authenticationService;

    /**
     * Instantiates a new Contract controller.
     *
     * @param contractService the contract service
     * @param authService Spring Security component used to authenticate and authorize the user
     */
    public ContractPublicController(ContractService contractService, RoleAuthenticationService authService,
                                    ContractRepository contractRepository) {
        this.contractService = contractService;
        this.authenticationService = authService;
        this.contractRepository = contractRepository;
    }

    @GetMapping("/{id}")
    ResponseEntity<ContractDto> getContract(@PathVariable UUID id) {
        ContractDto contract = contractRepository.findById(id).orElseThrow(ContractNotFoundException::new).getDto();
        UUID userId = authenticationService.getUserId();
        if (contract.getContractParties().getEmployeeId().equals(userId)
                || contract.getContractParties().getEmployerId().equals(userId)
                || authenticationService.hasAtLeastRole(Role.HR)) {
            return ResponseEntity.ok(contract);
        }
        throw new ActionNotAllowedException("You are not allowed to view this contract");
    }

    @PostMapping("")
    ResponseEntity<ContractDto> addContract(@RequestBody @Valid ContractDto contractDto) {
        if (authenticationService.hasAtLeastRole(Role.HR)) {
            contractDto.getContractParties().setEmployerId(authenticationService.getUserId());
            Contract contract = contractService.addContract(contractDto);
            return ResponseEntity.created(URI.create("/contract/" + contract.getId()))
                    .body(contract.getDto());
        }
        throw new ActionNotAllowedException("You are not allowed to add a contract");
    }

    @DeleteMapping("/{id}")
    ResponseEntity<ContractDto> terminateContract(@PathVariable UUID id) {
        if (authenticationService.hasAtLeastRole(Role.HR)) {
            contractService.terminateContract(id);
            return ResponseEntity.noContent().build();
        }
        throw new ActionNotAllowedException("You are not allowed to delete a contract");
    }

    @PutMapping("/{id}")
    ResponseEntity<ContractDto> modifyDraftContract(@PathVariable UUID id,
                                                    @Valid @RequestBody ContractModificationDto mod) {
        if (authenticationService.hasAtLeastRole(Role.HR)) {
            Contract contract = contractRepository.findById(id).orElseThrow(ContractNotFoundException::new);
            if (contract.isDraft()) {
                return ResponseEntity.ok(contractService.modifyDraftContract(contract, mod).getDto());
            } else {
                throw new ActionNotAllowedException("You are not allowed to change non draft contracts");
            }
        }
        throw new ActionNotAllowedException("You are not allowed to modify a contract");
    }
}
