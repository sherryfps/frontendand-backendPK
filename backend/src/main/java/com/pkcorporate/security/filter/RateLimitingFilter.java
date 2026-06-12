package com.pkcorporate.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Map<String, TokenBucket> LIMIT_MAP = new ConcurrentHashMap<>();

    private static class TokenBucket {
        private final long capacity;
        private final long refillPeriodMs;
        private final long refillAmount;
        private double tokens;
        private long lastRefillTime;

        public TokenBucket(long capacity, long refillPeriodMs, long refillAmount) {
            this.capacity = capacity;
            this.refillPeriodMs = refillPeriodMs;
            this.refillAmount = refillAmount;
            this.tokens = capacity;
            this.lastRefillTime = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        public synchronized long getSecondsToWait() {
            if (tokens >= 1.0) return 0;
            long now = System.currentTimeMillis();
            long nextRefillTime = lastRefillTime + refillPeriodMs;
            long waitMs = nextRefillTime - now;
            return Math.max(1, waitMs / 1000);
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long timePassed = now - lastRefillTime;
            if (timePassed >= refillPeriodMs) {
                double refills = (double) timePassed / refillPeriodMs;
                tokens = Math.min(capacity, tokens + refills * refillAmount);
                lastRefillTime = now;
            }
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = getClientIP(request);
        String user = request.getHeader("X-User-ID");

        String limitKey;
        long capacity;
        long periodMs;

        if (path.contains("/auth/")) {
            // Auth endpoints: 5 requests per 15 minutes per IP
            limitKey = "auth:" + ip;
            capacity = 5;
            periodMs = TimeUnit.MINUTES.toMillis(15);
        } else if (path.contains("/upload") || path.contains("/upload-logo") || path.contains("/upload-references")) {
            // File upload endpoints: 5 requests per minute per IP
            limitKey = "upload:" + ip;
            capacity = 5;
            periodMs = TimeUnit.MINUTES.toMillis(1);
        } else if (path.contains("/ai/")) {
            // AI / LLM proxy endpoints: 10 requests per minute per user (IP fallback)
            limitKey = "ai:" + (user != null ? user : ip);
            capacity = 10;
            periodMs = TimeUnit.MINUTES.toMillis(1);
        } else {
            // General API routes: 60 requests per minute per IP
            limitKey = "general:" + ip;
            capacity = 60;
            periodMs = TimeUnit.MINUTES.toMillis(1);
        }

        TokenBucket bucket = LIMIT_MAP.computeIfAbsent(limitKey, k -> new TokenBucket(capacity, periodMs, capacity));

        if (!bucket.tryConsume()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            long waitSeconds = bucket.getSecondsToWait();
            response.setHeader("Retry-After", String.valueOf(waitSeconds));

            Map<String, Object> errorDetails = Map.of(
                "success", false,
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "error", "Too Many Requests",
                "message", "Too many requests. Please wait " + waitSeconds + " seconds before trying again."
            );

            new ObjectMapper().writeValue(response.getOutputStream(), errorDetails);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
