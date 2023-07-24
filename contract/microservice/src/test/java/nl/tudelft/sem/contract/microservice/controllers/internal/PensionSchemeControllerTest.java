package nl.tudelft.sem.contract.microservice.controllers.internal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.Optional;
import nl.tudelft.sem.contract.commons.entities.PensionSchemeDto;
import nl.tudelft.sem.contract.commons.entities.utils.StringDto;
import nl.tudelft.sem.contract.microservice.TestHelpers;
import nl.tudelft.sem.contract.microservice.database.entities.PensionScheme;
import nl.tudelft.sem.contract.microservice.database.repositories.PensionSchemeRepository;
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
public class PensionSchemeControllerTest {
    private final transient MockMvc mockMvc;
    private final transient ObjectMapper objectMapper;

    @MockBean
    private transient PensionSchemeRepository pensionSchemeRepository;

    @Autowired
    public PensionSchemeControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
        this.objectMapper = new ObjectMapper().registerModules(new Jdk8Module(), new JavaTimeModule());
    }

    @Test
    void getNonExistingPensionScheme() throws Exception {
        this.mockMvc.perform(MockMvcRequestBuilders.get("/internal/pension-scheme/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getExistingPensionScheme() throws Exception {
        PensionScheme pensionScheme = PensionScheme.builder()
                .id(TestHelpers.getUuid(1))
                .name("You get nothing")
                .build();

        when(pensionSchemeRepository.findById(TestHelpers.getUuid(1))).thenReturn(Optional.of(pensionScheme));

        this.mockMvc.perform(MockMvcRequestBuilders.get("/internal/pension-scheme/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(pensionScheme.getDto())));
    }

    @Test
    void addPensionScheme() throws Exception {
        PensionSchemeDto pensionSchemeDto = PensionSchemeDto.builder()
                .name("You get nothing")
                .build();

        when(pensionSchemeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        this.mockMvc.perform(MockMvcRequestBuilders.post("/internal/pension-scheme")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pensionSchemeDto)))
                .andExpect(status().isCreated());
    }

    @Test
    void deleteNonExistentPensionScheme() throws Exception {
        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/pension-scheme/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletePensionScheme() throws Exception {
        PensionScheme pensionScheme = PensionScheme.builder()
                .id(TestHelpers.getUuid(1))
                .name("You get nothing")
                .build();

        when(pensionSchemeRepository.findById(TestHelpers.getUuid(1))).thenReturn(Optional.of(pensionScheme));

        this.mockMvc.perform(MockMvcRequestBuilders.delete("/internal/pension-scheme/{id}", TestHelpers.getUuid(1)))
                .andExpect(status().isOk());
    }

    @Test
    void editNameNonExistent() throws Exception {
        StringDto newName = new StringDto("AOW");

        this.mockMvc.perform(MockMvcRequestBuilders.put("/internal/pension-scheme/{id}/edit-name", TestHelpers.getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newName)))
                .andExpect(status().isNotFound());
    }

    @Test
    void editNameExistent() throws Exception {
        StringDto newName = new StringDto("AOW");

        PensionScheme pensionScheme = PensionScheme.builder()
                .id(TestHelpers.getUuid(1))
                .name("You get nothing")
                .build();

        PensionScheme editedPensionScheme = PensionScheme.builder()
                .id(TestHelpers.getUuid(1))
                .name("AOW")
                .build();

        when(pensionSchemeRepository.findById(TestHelpers.getUuid(1))).thenReturn(Optional.of(pensionScheme));

        this.mockMvc.perform(MockMvcRequestBuilders.put("/internal/pension-scheme/{id}/edit-name", TestHelpers.getUuid(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newName)))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(editedPensionScheme.getDto())));
    }
}
