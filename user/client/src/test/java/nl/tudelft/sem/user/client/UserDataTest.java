package nl.tudelft.sem.user.client;

import static nl.tudelft.sem.user.client.TestHelpers.getUuid;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletionException;
import nl.tudelft.sem.user.client.util.ResponseException;
import nl.tudelft.sem.user.commons.ApiError;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import nl.tudelft.sem.user.commons.entities.utils.RoleDto;
import nl.tudelft.sem.user.commons.entities.utils.UserDto;
import nl.tudelft.sem.user.commons.entities.utils.UuidDto;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


class UserDataTest {
    private MockWebServer mockServer;
    private final transient ObjectMapper objectMapper = new ObjectMapper();
    private UserClient client;

    @AfterEach
    void tearDown() throws IOException {
        mockServer.shutdown();
    }

    @BeforeEach
    void setUp() throws IOException {
        this.mockServer = new MockWebServer();
        this.mockServer.start();
        this.client = new UserClient(new UserClientConfiguration(mockServer.url("/").uri()));
    }

    @Test
    void getExistingUser() throws JsonProcessingException, InterruptedException {
        UserDto user = UserDto.builder().build();
        user.setNetId("SomeUser");
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .setBody(objectMapper.writeValueAsString(user))
        );

        UserDto returnedUser = client.user().getuser(getUuid(1)).join();
        assertEquals(returnedUser.getNetId(), user.getNetId());
        assertTrue(Objects.requireNonNull(mockServer.takeRequest().getPath())
                .endsWith("/user/" + getUuid(1)));
    }

    @Test
    void getExistingUserRoleNetId() throws JsonProcessingException, InterruptedException {
        UserDto user = new UserDto();
        user.setNetId("SomeUser");
        user.setRole(Role.ADMIN);
        RoleDto role = RoleDto.builder().build();
        role.setRole(Role.ADMIN);
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .setBody(objectMapper.writeValueAsString(role))
        );

        RoleDto returnedRole = client.user().getUserRoleNetId(user.getNetId()).join();
        assertEquals(returnedRole.getRole(), user.getRole());
        assertTrue(Objects.requireNonNull(mockServer.takeRequest().getPath())
                .endsWith("/user/getRoleByNetId/" + user.getNetId()));
    }

    @Test
    void getExistingUserRoleUuid() throws JsonProcessingException, InterruptedException {
        UserDto user = new UserDto();
        user.setNetId("SomeUser");
        user.setRole(Role.ADMIN);
        user.setId(getUuid(1));
        RoleDto role = RoleDto.builder().build();
        role.setRole(Role.ADMIN);
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .setBody(objectMapper.writeValueAsString(role))
        );

        RoleDto returnedRole = client.user().getUserRoleUuid(user.getId()).join();
        assertEquals(returnedRole.getRole(), user.getRole());
        assertTrue(Objects.requireNonNull(mockServer.takeRequest().getPath())
                .endsWith("/user/getRoleByUUID/" + user.getId()));
    }

    @Test
    void getUuidFromNetId() throws JsonProcessingException, InterruptedException {
        UserDto userDto = UserDto.builder()
                .netId("netId")
                .uuid(getUuid(1))
                .build();

        UuidDto uuid = new UuidDto(getUuid(1));
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .setBody(objectMapper.writeValueAsString(uuid))
        );

        UuidDto returnedRole = client.user().getUuid(userDto.getNetId()).join();
        assertEquals(returnedRole.getUuid(), userDto.getId());
        assertTrue(Objects.requireNonNull(mockServer.takeRequest().getPath())
                .endsWith("/user/getUUID/" + userDto.getNetId()));
    }

    @Test
    void getNonExistingUser() throws JsonProcessingException {
        ApiError err = new ApiError();
        err.setStatus(404);
        err.setDescription("Resource not found");
        mockServer.enqueue(new MockResponse()
                .setResponseCode(404)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .setBody(objectMapper.writeValueAsString(err))
        );

        CompletionException actualException = assertThrows(CompletionException.class,
                () -> client.user().getuser(getUuid(1)).join());
        assertInstanceOf(ResponseException.class, actualException.getCause());
        assertEquals(404, ((ResponseException) actualException.getCause()).error().getStatus());
    }

    @Test
    void getNullUser() {
        //noinspection DataFlowIssue
        assertThrows(NullPointerException.class, () -> client.user().getuser(null));
    }

    @Test
    void nullThrower() {
        Assertions.assertNotNull(client.user().getuser(UUID.randomUUID()));
    }
}