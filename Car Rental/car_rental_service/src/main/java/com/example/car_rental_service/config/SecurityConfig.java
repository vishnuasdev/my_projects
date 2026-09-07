package com.example.car_rental_service.config;

import com.example.car_rental_service.security.CustomUserDetailsService;
import com.example.car_rental_service.security.JwtFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(JwtFilter jwtFilter, CustomUserDetailsService customUserDetailsService) {
        this.jwtFilter = jwtFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // 1. Preflight OPTIONS & Public Auth Endpoints
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // 2. Public car catalog and images only (not owner/agency listings)
                        .requestMatchers(HttpMethod.GET, "/api/cars/available").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cars/*/image/*").permitAll()

                        // 3. Shared Operations
                        .requestMatchers(HttpMethod.GET, "/api/cars/my-cars").hasAuthority("OWNER")
                        .requestMatchers(HttpMethod.GET, "/api/cars/agency/**").hasAnyAuthority("AGENCY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/cars/owner/**").hasAnyAuthority("OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/cars/add", "/api/cars/create")
                        .hasAnyAuthority("ADMIN", "AGENCY", "OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/cars/**")
                        .hasAnyAuthority("ADMIN", "OWNER")

                        .requestMatchers(HttpMethod.POST, "/api/bids/place")
                        .hasAuthority("OWNER")
                        .requestMatchers(HttpMethod.PATCH, "/api/bids/**")
                        .hasAnyAuthority("ADMIN", "AGENCY")
                        .requestMatchers(HttpMethod.DELETE, "/api/bids/**")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/bookings/create")
                        .hasAuthority("CUSTOMER")
                        .requestMatchers(HttpMethod.PATCH, "/api/bookings/*/status")
                        .hasAnyAuthority("ADMIN", "AGENCY")
                        .requestMatchers(HttpMethod.PATCH, "/api/bookings/*/cancel")
                        .hasAnyAuthority("ADMIN", "CUSTOMER")

                        // 4. Role-Specific Section Matchers
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/agency/**").hasAuthority("AGENCY")
                        .requestMatchers("/api/owner/**").hasAuthority("OWNER")
                        .requestMatchers("/api/customers/admin/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/customers").hasAuthority("ADMIN")
                        .requestMatchers("/api/customers/**").hasAnyAuthority("CUSTOMER", "ADMIN")

                        // 5. Fallback Guard
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Unauthorized: Missing or invalid JWT token\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Forbidden: Insufficient permissions\"}");
                        })
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}