package nl.tudelft.sem.contract.microservice.controllers.internal;

import static nl.tudelft.sem.contract.microservice.TestHelpers.getUuid;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.math.BigDecimal;
import java.util.Optional;
import nl.tudelft.sem.contract.commons.entities.utils.StringDto;
import nl.tudelft.sem.contract.microservice.TestHelpers;
import nl.tudelft.sem.contract.microservice.database.entities.JobPosition;
import nl.tudelft.sem.contract.microservice.database.entities.SalaryScale;
import nl.tudelft.sem.contract.microservice.database.entities.utils.Pay;
import nl.tudelft.sem.contract.microservice.database.repositories.JobPositionRepository;
import nl.tudelft.sem.contract.microservice.database.repositories.SalaryScaleRepository;
import nl.tudelft.sem.contract.microservice.services.JobPositionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootTest
@AutoConfigureMockMvc
@EnableWebMvc
@ActiveProfiles(profiles = "testing")
public class JobPositionControllerTest {
    private final transient MockMvc mockMvc;
    private final transient ObjectMapper objectMapper;

    @MockBean
    private transient JobPositionService jobPositionService;

    @MockBean
    private transient JobPositionRepository jobPositionRepository;

    @MockBean
    private transient SalaryScaleRepository salaryScalerepository;


    @Autowired
    JobPositionControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
        this.objectMapper = new ObjectMapper().registerModules(new Jdk8Module(), new JavaTimeModule());
    }

    private SalaryScale getSampleSalaryScale(int id) {
        return SalaryScale.builder()
                .id(getUuid(id))
                .pay(new Pay(new BigDecimal("34" + id + ".12"), new BigDecimal("35" + id + ".12")))
                .step(new BigDecimal("0.0" + id))
                .build();
    }

    @Test
    void getNonExistingJobPosition() throws Exception {
        this.mockMvc.perform(MockMvcRequestBuilders.get("/internal/job-position/{id}", getUuid(1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getExistingJobPosition() throws Exception {
        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .build();

        when(jobPositionRepository.findById(getUuid(1))).thenReturn(Optional.of(jobPosition));

        this.mockMvc.perform(MockMvcRequestBuilders.get("/internal/job-position/{id}", getUuid(1)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(jobPosition.getDto())));
    }

    @Test
    void addNewJobPosition() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(2);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        when(jobPositionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        this.mockMvc.perform(MockMvcRequestBuilders.post("/internal/job-position")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobPosition.getDto())))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteJobTestFailsMutant() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(2);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        when(jobPositionRepository.findById(any())).thenReturn(Optional.of(jobPosition));

        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/job-position/{id}", TestHelpers.getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobPosition.getDto())))
                .andExpect(status().isOk());
    }

    @Test
    void deleteJobTestSucceedsMutant() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(2);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        when(jobPositionRepository.findById(any())).thenReturn(Optional.of(jobPosition));

        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/job-position/{id}", TestHelpers.getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobPosition.getDto())))
                        .andExpect(status().isOk())
                        .andExpect(content().json(objectMapper.writeValueAsString(jobPosition.getDto())));
        verify(jobPositionRepository).deleteById(TestHelpers.getUuid(1));
    }

    @Test
    void removeNonExistentJobPosition() throws Exception {
        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/job-position/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeJobPosition() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(1);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        when(jobPositionRepository.findById(getUuid(1))).thenReturn(Optional.of(jobPosition));

        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/job-position/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isOk());
    }

    @Test
    void editNameNonExistent() throws Exception {
        StringDto newName = new StringDto("small boss");

        this.mockMvc.perform(MockMvcRequestBuilders.put("/internal/job-position/{id}/edit-name", getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newName)))
                .andExpect(status().isNotFound());
    }

    @Test
    void editNameExisting() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(1);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        JobPosition changedJobPosition = JobPosition.builder()
                .id(getUuid(2))
                .name("small boss")
                .salaryScale(salaryScale)
                .build();

        StringDto newName = new StringDto("small boss");

        when(jobPositionRepository.findById(getUuid(1))).thenReturn(Optional.of(jobPosition));
        when(jobPositionService.editName(jobPosition, newName)).thenReturn(changedJobPosition);

        this.mockMvc.perform(MockMvcRequestBuilders.put("/internal/job-position/{id}/edit-name", getUuid(1))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newName)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(changedJobPosition.getDto())));
    }

    @Test
    void editSalaryScaleNonExistent() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(1);

        this.mockMvc.perform(MockMvcRequestBuilders
                        .put("/internal/job-position/{id}/edit-salary-scale", getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(salaryScale.getDto())))
                .andExpect(status().isNotFound());
    }

    @Test
    void editSalaryScaleExistent() throws Exception {
        SalaryScale salaryScale = getSampleSalaryScale(1);
        SalaryScale newSalaryScale = getSampleSalaryScale(2);

        JobPosition jobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(salaryScale)
                .build();

        JobPosition changedJobPosition = JobPosition.builder()
                .id(getUuid(1))
                .name("big boss")
                .salaryScale(newSalaryScale)
                .build();

        when(jobPositionRepository.findById(getUuid(1))).thenReturn(Optional.of(jobPosition));
        when(jobPositionService.editSalaryScale(any(), any())).thenReturn(changedJobPosition);

        this.mockMvc.perform(MockMvcRequestBuilders
                        .put("/internal/job-position/{id}/edit-salary-scale", getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newSalaryScale.getDto())))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(changedJobPosition.getDto())));
    }

}
