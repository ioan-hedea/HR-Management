package nl.tudelft.sem.gateway.router.services;

import java.util.List;
import nl.tudelft.sem.gateway.router.config.SecurityConfiguration;
import nl.tudelft.sem.gateway.router.util.IpRangeReactiveAuthorizationManager;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.header.XFrameOptionsServerHttpHeadersWriter;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;

@Component
public class SecurityService {
    private final transient SecurityConfiguration securityConfiguration;

    public SecurityService(SecurityConfiguration securityConfiguration) {
        this.securityConfiguration = securityConfiguration;
    }

    @Bean
    SecurityWebFilterChain springWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf().disable()
                .httpBasic().disable()
                .formLogin().disable()
                .logout().disable()
                .cors().configurationSource(exchange -> {
                    CorsConfiguration corsConfiguration = new CorsConfiguration();
                    corsConfiguration.setAllowedOrigins(securityConfiguration.getAllowedOrigins());
                    corsConfiguration.setAllowedMethods(List.of(
                            HttpMethod.GET.name(),
                            HttpMethod.POST.name(),
                            HttpMethod.PUT.name(),
                            HttpMethod.DELETE.name(),
                            HttpMethod.OPTIONS.name()
                    ));
                    corsConfiguration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
                    corsConfiguration.setExposedHeaders(List.of("Location"));
                    corsConfiguration.setAllowCredentials(false);
                    corsConfiguration.setMaxAge(3600L);
                    return corsConfiguration;
                })
                .and()
                .headers()
                    .frameOptions().mode(XFrameOptionsServerHttpHeadersWriter.Mode.SAMEORIGIN)
                .and()
                .authorizeExchange()
                    // Prevent outsiders from accessing internal endpoints
                    .pathMatchers("/*/internal/**")
                        .access(new IpRangeReactiveAuthorizationManager(securityConfiguration.getInternalRanges()))
                    .pathMatchers("/*/actuator/**")
                        .access(new IpRangeReactiveAuthorizationManager(securityConfiguration.getInternalRanges()))
                .anyExchange().permitAll()
                .and()
                .build();
    }
}
