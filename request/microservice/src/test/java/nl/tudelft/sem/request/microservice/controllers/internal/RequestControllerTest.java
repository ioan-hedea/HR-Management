package nl.tudelft.sem.request.microservice.controllers.internal;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nl.tudelft.sem.contract.commons.entities.ContractModificationDto;
import nl.tudelft.sem.request.microservice.TestUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;


@SpringBootTest
@AutoConfigureMockMvc
@EnableWebMvc
@ActiveProfiles("test")
class RequestControllerTest {
    private final transient MockMvc mockMvc;
    private final transient ObjectMapper objectMapper;

    @Autowired
    RequestControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
        this.objectMapper = new ObjectMapper().registerModules(new Jdk8Module(), new JavaTimeModule());
    }

    @Test
    void modifyContractBadRequest() throws Exception {
        ContractModificationDto modDto = ContractModificationDto.builder()
                .vacationDays(0) // should be in-between [15, 30]
                .jobPosition("test")
                .build();

        mockMvc.perform(MockMvcRequestBuilders.post("/internal/request/contract/{id}", TestUtils.defaultUuid())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(modDto)))
                .andExpect(status().isBadRequest());
    }
}
