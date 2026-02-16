package com.manvith.healthcare_backend.security;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final int maxRequestsPerMinute;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public LoginRateLimitFilter(
            @Value("${security.ratelimit.auth.max-requests-per-minute:20}") int maxRequestsPerMinute
    ) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !"/api/auth/login".equals(path) && !"/api/auth/register".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        long nowMillis = Instant.now().toEpochMilli();

        Window window = windows.compute(ip, (k, existing) -> {
            if (existing == null || nowMillis > existing.windowStartMillis + 60_000L) {
                return new Window(nowMillis, 1);
            }
            return new Window(existing.windowStartMillis, existing.count + 1);
        });

        if (window.count > maxRequestsPerMinute) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many authentication requests. Please try again in a minute.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private record Window(long windowStartMillis, int count) {}
}
