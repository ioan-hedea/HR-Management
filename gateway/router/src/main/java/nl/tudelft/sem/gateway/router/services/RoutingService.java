package nl.tudelft.sem.gateway.router.services;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class RoutingService {
    /**
     * Add a route to the route builder.
     *
     * @param builder The builder to use.
     * @param routeName The name of the route (only for internal representation).
     * @param path The path to match.
     * @param uri The URI to forward to.
     * @return The builder with added routing logic.
     */
    private static RouteLocatorBuilder.Builder addRoute(RouteLocatorBuilder.Builder builder,
                                                        String routeName,
                                                        String path,
                                                        String uri) {
        return builder
                .route(routeName, r -> r.path(String.format("/%s/**", path))
                        .filters(f -> f.stripPrefix(1))
                        .uri(uri))
                .route(routeName + "-api", r -> r.path(String.format("/api/%s/**", path))
                        .filters(f -> f.stripPrefix(2))
                        .uri(uri));
    }

    /**
     * Configure the routes.
     *
     * @param builder RouteLocatorBuilder used to build the routes
     * @return Generated RouteLocator
     */
    @Bean
    public RouteLocator configureRoute(RouteLocatorBuilder builder) {
        RouteLocatorBuilder.Builder routeBuilder = builder.routes();
        routeBuilder = addRoute(routeBuilder, "auth", "auth", "lb://AUTHENTICATION-SERVICE");
        routeBuilder = addRoute(routeBuilder, "contract", "contract", "lb://CONTRACT-SERVICE");
        routeBuilder = addRoute(routeBuilder, "notification", "notification", "lb://NOTIFICATION-SERVICE");
        routeBuilder = addRoute(routeBuilder, "user", "user", "lb://USER-SERVICE");
        routeBuilder = addRoute(routeBuilder, "request", "request", "lb://REQUEST-SERVICE");
        return routeBuilder.build();
    }
}
