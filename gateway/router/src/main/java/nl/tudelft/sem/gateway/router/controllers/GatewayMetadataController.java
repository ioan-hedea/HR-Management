package nl.tudelft.sem.gateway.router.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal gateway metadata endpoint so the gateway itself has OpenAPI output.
 */
@RestController
@RequestMapping("/gateway")
@Tag(name = "Gateway")
public class GatewayMetadataController {
    /**
     * Lists the primary route prefixes served by the gateway.
     *
     * @return route descriptors
     */
    @GetMapping("/routes")
    @Operation(summary = "List gateway route prefixes")
    public List<RouteDescription> listRoutes() {
        return List.of(
                new RouteDescription("auth", "AUTHENTICATION-SERVICE"),
                new RouteDescription("user", "USER-SERVICE"),
                new RouteDescription("contract", "CONTRACT-SERVICE"),
                new RouteDescription("request", "REQUEST-SERVICE"),
                new RouteDescription("notification", "NOTIFICATION-SERVICE")
        );
    }

    public static record RouteDescription(String prefix, String targetService) { }
}
