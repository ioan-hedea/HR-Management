package nl.tudelft.sem.request.microservice.services;

import static nl.tudelft.sem.request.microservice.TestHelpers.getUuid;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import nl.tudelft.sem.contract.client.ContractClient;
import nl.tudelft.sem.contract.client.ContractData;
import nl.tudelft.sem.contract.commons.entities.ContractDto;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.contract.commons.entities.ContractTermsDto;
import nl.tudelft.sem.request.commons.entities.RequestStatus;
import nl.tudelft.sem.request.microservice.database.entities.GeneralRequest;
import nl.tudelft.sem.request.microservice.database.entities.LeaveRequest;
import nl.tudelft.sem.request.microservice.database.entities.TerminationRequest;
import nl.tudelft.sem.request.microservice.database.entities.VacationRequest;
import nl.tudelft.sem.request.microservice.database.repositories.RequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
public class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;
    @Mock
    private ContractClient contractClient;
    @Mock
    private ContractData contractData;
    @InjectMocks
    private RequestService requestService;

    @Test
    void approveRequest() {
        GeneralRequest request = GeneralRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .build();

        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.approveRequest(request);
        verify(requestRepository, times(1)).save(any());
        assertEquals(result.getId(), request.getId());
        assertEquals(result.getStatus(), RequestStatus.APPROVED);
    }

    @Test
    void approveVacationRequest()  {

        GeneralRequest request = VacationRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .startDate(LocalDateTime.of(2022, 1, 1, 1, 1))
                .numberOfDays(5)
                .build();

        when(contractClient.contract()).thenReturn(contractData);
        when(contractData.getContract(any())).thenReturn(CompletableFuture.completedFuture(
                ContractDto.builder()
                        .contractTerms(ContractTermsDto.builder()
                                .vacationDays(30)
                                .salaryScalePoint(BigDecimal.valueOf(1))
                                .build())
                        .build()));
        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.approveRequest(request);
        verify(requestRepository, times(1)).save(any());
        assertEquals(result.getId(), request.getId());
        assertEquals(result.getStatus(), RequestStatus.APPROVED);
    }

    @Test
    void insufficientDays()  {
        GeneralRequest request = VacationRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .startDate(LocalDateTime.of(2022, 1, 1, 1, 1))
                .numberOfDays(20)
                .build();

        ContractDto contractDto = ContractDto.builder()
                .contractTerms(ContractTermsDto.builder().vacationDays(15)
                        .salaryScalePoint(BigDecimal.valueOf(0.1))
                        .build())
                .build();

        when(contractClient.contract()).thenReturn(contractData);
        when(contractData.getContract(request.getContractId())).thenReturn(CompletableFuture.completedFuture(contractDto));
        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.approveRequest(request);
        verify(requestRepository, times(1)).save(any());
        assertEquals(request.getId(), result.getId());
        assertEquals("You don't have enough remaining vacation days.", result.getResponseBody());
        assertEquals(RequestStatus.REJECTED, result.getStatus());
    }

    @Test
    void approveLeave() {
        GeneralRequest request = LeaveRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .build();

        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.approveRequest(request);
        verify(requestRepository, times(1)).save(any());
        assertEquals(result.getId(), request.getId());
        assertEquals(result.getStatus(), RequestStatus.APPROVED);
    }

    @Test
    void rejectRequest() {
        GeneralRequest request = GeneralRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .build();

        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.rejectRequest(request, "We have denied the request because of X");
        verify(requestRepository, times(1)).save(any());
        assertEquals(result.getId(), request.getId());
        assertEquals(result.getStatus(), RequestStatus.REJECTED);
        assertEquals(result.getResponseBody(), "We have denied the request because of X");
    }

    @Test
    void approveTerminationRequest() {
        GeneralRequest request = TerminationRequest.builder()
                .id(getUuid(1))
                .contractId(getUuid(2))
                .status(RequestStatus.OPEN)
                .build();

        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GeneralRequest result = requestService.approveRequest(request);
        verify(requestRepository, times(1)).save(any());
        assertEquals(result.getId(), request.getId());
        assertEquals(result.getStatus(), RequestStatus.APPROVED);
    }

    @Test
    void modifyContract_invalid() {
        assertEquals(Optional.empty(), requestService.modifyContract(null, null));
        assertEquals(Optional.empty(), requestService.modifyContract(UUID.randomUUID(), null));
    }

    @Test
    void modifyContract_returnsEmptyOptional() {
        UUID id = UUID.randomUUID();
        ContractModificationDto modifications = new ContractModificationDto();
        Optional<GeneralRequest> result = requestService.modifyContract(id, modifications);
        assertEquals(result, Optional.empty());
    }

    @Test
    void addResponse_requestFound() {
        UUID id = UUID.randomUUID();
        GeneralRequest request = GeneralRequest.builder()
                .id(id)
                .status(RequestStatus.OPEN)
                .build();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        when(requestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<GeneralRequest> result = requestService.addResponse(id, "response");
        verify(requestRepository, times(1)).findById(id);
        verify(requestRepository, times(1)).save(request);
        assertEquals(result.get().getId(), request.getId());
        assertEquals(result.get().getResponseBody(), "response");
        assertEquals(result.get().getStatus(), RequestStatus.APPROVED);
    }

    @Test
    void addResponse_requestNotFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.empty());

        Optional<GeneralRequest> result = requestService.addResponse(id, "response");
        verify(requestRepository, times(1)).findById(id);
        assertEquals(result, Optional.empty());
    }

    @Test
    void addRequestDocument_validInput_requestSaved() {
        String author = "test_author";
        Authentication auth = Mockito.mock(Authentication.class);
        SecurityContext sc = Mockito.mock(SecurityContext.class);

        // stub the Authentication object to return the author name
        Mockito.when(auth.getName()).thenReturn(author);
        // stub the SecurityContext object to return the Authentication object
        Mockito.when(sc.getAuthentication()).thenReturn(auth);
        // stub the SecurityContextHolder to return the SecurityContext object
        SecurityContextHolder.setContext(sc);

        UUID id = UUID.randomUUID();
        String body = "test message";
        GeneralRequest request = GeneralRequest.builder()
                .id(id)
                .status(RequestStatus.OPEN)
                .author("test_author")
                .requestBody(id + "\n" + body)
                .requestDate(LocalDateTime.now())
                .responseBody(null)
                .responseDate(null)
                .startDate(null)
                .numberOfDays(0)
                .build();


        when(requestRepository.save(any())).thenReturn(request);
        GeneralRequest result = requestService.addRequestDocument(id, body);
        assertEquals(request.getRequestBody(), result.getRequestBody());
        // clear the SecurityContextHolder after the test
        SecurityContextHolder.clearContext();
    }
}
