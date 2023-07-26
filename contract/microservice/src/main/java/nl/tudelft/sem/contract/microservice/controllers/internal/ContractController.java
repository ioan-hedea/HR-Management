package nl.tudelft.sem.contract.microservice.controllers.internal;

import static nl.tudelft.sem.contract.commons.ApiData.INTERNAL_PATH;

import java.net.URI;
import java.util.UUID;
import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.commons.entities.ActionSuccessDto;
import nl.tudelft.sem.contract.commons.entities.ContractDto;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.contract.commons.entities.ContractStatus;
import nl.tudelft.sem.contract.microservice.database.entities.Contract;
import nl.tudelft.sem.contract.microservice.database.repositories.ContractRepository;
import nl.tudelft.sem.contract.microservice.exceptions.ActionNotAllowedException;
import nl.tudelft.sem.contract.microservice.exceptions.ContractNotFoundException;
import nl.tudelft.sem.contract.microservice.services.ContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(INTERNAL_PATH + "/contract")
public class ContractController {
    private final transient ContractRepository contractRepository;
    private final transient ContractService contractService;

    /**
     * Contract Controller Constructor.
     *
     * @param contractRepository repository for contract
     * @param contractService contract service
     */
    public ContractController(ContractRepository contractRepository, ContractService contractService) {
        this.contractRepository = contractRepository;
        this.contractService = contractService;
    }

    /**
     * Get a contract by its id.
     *
     * @param id the id of the contract
     * @return the contract with the given id
     */
    @GetMapping("/{id}")
    ResponseEntity<ContractDto> getContract(@PathVariable UUID id) {
        return ResponseEntity.ok(contractRepository.findById(id).orElseThrow(ContractNotFoundException::new).getDto());
    }

    /**
     * Get the current contract for an employee.
     *
     * <p>Returns the most recent active contract if present; otherwise returns the employee's latest contract.
     *
     * @param employeeId employee id
     * @return current contract dto
     */
    @GetMapping("/current/employee/{employeeId}")
    ResponseEntity<ContractDto> getCurrentContractForEmployee(@PathVariable UUID employeeId) {
        return contractRepository
                .findFirstByContractPartiesEmployeeIdAndContractInfoStatusOrderByContractTermsStartDateDescIdDesc(
                        employeeId, ContractStatus.ACTIVE
                )
                .or(() -> contractRepository.findFirstByContractPartiesEmployeeIdOrderByContractTermsStartDateDescIdDesc(
                        employeeId
                ))
                .map(contract -> ResponseEntity.ok(contract.getDto()))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("")
    ResponseEntity<ContractDto> addContract(@RequestBody @Valid ContractDto contractDto) {
        Contract contract = contractService.addContract(contractDto);
        return ResponseEntity.created(URI.create(INTERNAL_PATH + "/contract/" + contract.getId()))
                .body(contract.getDto());
    }

    @DeleteMapping("/{id}")
    ResponseEntity<ContractDto> deleteContract(@PathVariable UUID id) {
        ContractDto contractDto = contractRepository.findById(id)
                .orElseThrow(ContractNotFoundException::new).getDto();
        contractRepository.deleteById(id);
        return ResponseEntity.ok(contractDto);
    }

    /**
     * Modify existing contract that is still in the draft phase,
     * not all fields have to be changed.
     *
     * @param id the contract id
     * @param mod the items to be modified
     * @return the modified version of the contract
     */
    @PutMapping("/{id}")
    @ResponseBody
    ResponseEntity<ContractDto> modifyDraftContract(@PathVariable UUID id,
                                                    @Valid @RequestBody ContractModificationDto mod) {
        Contract contract = contractRepository.findById(id).orElseThrow(ContractNotFoundException::new);
        if (contract.isDraft()) {
            return ResponseEntity.ok(contractService.modifyDraftContract(contract, mod).getDto());
        } else {
            throw new ActionNotAllowedException("You are not allowed to change non draft contracts");
        }
    }

    /**
     * Terminate a contract by its ID.
     *
     * @param id the ID of the contract to terminate.
     * @return Success DTO if the contract was terminated successfully.
     */
    @DeleteMapping("/terminate/{id}")
    public ResponseEntity<ActionSuccessDto> terminateContract(@PathVariable UUID id) {
        contractService.terminateContract(id);
        log.info("Contract {} terminated", id);
        return ResponseEntity.ok(new ActionSuccessDto());
    }
}
