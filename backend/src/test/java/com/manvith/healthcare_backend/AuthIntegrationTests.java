package com.manvith.healthcare_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "security.ratelimit.auth.max-requests-per-minute=1000"
)
class AuthIntegrationTests {

    @LocalServerPort
    private int port;

    private HttpClient client;
    private String baseUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        client = HttpClient.newHttpClient();
        baseUrl = "http://localhost:" + port;
    }

    @Test
    void registerShouldReturnAccessAndRefreshTokens() throws Exception {
        String email = "test+" + UUID.randomUUID() + "@mail.local";
        String payload = """
                {
                  "fullName": "Test User",
                  "email": "%s",
                  "password": "pass12345"
                }
                """.formatted(email);

        HttpResponse<String> response = post("/api/auth/register", payload, null);
        JsonNode node = objectMapper.readTree(response.body());

        assertEquals(200, response.statusCode());
        assertNotNull(node.path("token").asText(null));
        assertNotNull(node.path("refreshToken").asText(null));
        assertEquals(email.toLowerCase(), node.path("user").path("email").asText());
        assertEquals("PATIENT", node.path("user").path("role").asText());
    }

    @Test
    void protectedEndpointShouldRequireAuth() throws Exception {
        HttpResponse<String> response = get("/api/users/1", null);
        assertEquals(403, response.statusCode());
    }

    @Test
    void patientShouldNotReadAnotherUsersProfile() throws Exception {
        AuthData demo = login("demo@healthcare.local", "demo123");
        AuthData other = register("Other User", "other+" + UUID.randomUUID() + "@mail.local", "pass12345");

        HttpResponse<String> response = get("/api/users/" + other.userId, demo.accessToken);
        assertEquals(403, response.statusCode());
    }

    @Test
    void hospitalCreateShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");

        String payload = """
                {
                  "name": "Admin Added Hospital",
                  "address": "New York",
                  "phone": "+1-222-333-4444",
                  "lat": 40.7128,
                  "lng": -74.0060
                }
                """;

        HttpResponse<String> forbidden = post("/api/hospitals", payload, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> created = post("/api/hospitals", payload, admin.accessToken);
        assertEquals(200, created.statusCode());
        assertEquals("Admin Added Hospital", objectMapper.readTree(created.body()).path("name").asText());
    }

    @Test
    void hospitalCreateShouldValidateRequiredFields() throws Exception {
        AuthData admin = login("admin@healthcare.local", "admin123");
        String payloadMissingAddress = """
                {
                  "name": "Incomplete Hospital",
                  "address": "",
                  "phone": "+1-222-333-4444",
                  "lat": 40.7128,
                  "lng": -74.0060
                }
                """;

        HttpResponse<String> response = post("/api/hospitals", payloadMissingAddress, admin.accessToken);
        assertEquals(400, response.statusCode());
    }

    @Test
    void doctorCreateShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");

        String payload = """
                {
                  "name": "Dr. Admin Added",
                  "specialty": "Cardiology",
                  "rating": 4.8
                }
                """;

        HttpResponse<String> forbidden = post("/api/doctors", payload, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> created = post("/api/doctors", payload, admin.accessToken);
        assertEquals(200, created.statusCode());
        assertEquals("Dr. Admin Added", objectMapper.readTree(created.body()).path("name").asText());
    }

    @Test
    void doctorDeleteShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long doctorId = createDoctor(admin.accessToken, "Dr. Delete Target");

        HttpResponse<String> forbidden = delete("/api/doctors/" + doctorId, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> deleted = delete("/api/doctors/" + doctorId, admin.accessToken);
        assertEquals(200, deleted.statusCode());
    }

    @Test
    void hospitalDeleteShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long hospitalId = createHospital(admin.accessToken, "Hospital Delete Target");

        HttpResponse<String> forbidden = delete("/api/hospitals/" + hospitalId, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> deleted = delete("/api/hospitals/" + hospitalId, admin.accessToken);
        assertEquals(200, deleted.statusCode());
    }

    @Test
    void doctorUpdateShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long doctorId = createDoctor(admin.accessToken, "Dr. Update Target");

        String payload = """
                {
                  "name": "Dr. Updated Name",
                  "specialty": "Neurology",
                  "rating": 4.9
                }
                """;

        HttpResponse<String> forbidden = put("/api/doctors/" + doctorId, payload, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> updated = put("/api/doctors/" + doctorId, payload, admin.accessToken);
        assertEquals(200, updated.statusCode());
        assertEquals("Dr. Updated Name", objectMapper.readTree(updated.body()).path("name").asText());
    }

    @Test
    void hospitalUpdateShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long hospitalId = createHospital(admin.accessToken, "Hospital Update Target");

        String payload = """
                {
                  "name": "Hospital Updated Name",
                  "address": "Updated City",
                  "phone": "+1-444-555-6666",
                  "lat": 12.34,
                  "lng": 56.78
                }
                """;

        HttpResponse<String> forbidden = put("/api/hospitals/" + hospitalId, payload, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> updated = put("/api/hospitals/" + hospitalId, payload, admin.accessToken);
        assertEquals(200, updated.statusCode());
        assertEquals("Hospital Updated Name", objectMapper.readTree(updated.body()).path("name").asText());
    }

    @Test
    void refreshEndpointShouldIssueNewTokensAndInvalidateOldRefreshToken() throws Exception {
        AuthData demo = login("demo@healthcare.local", "demo123");

        HttpResponse<String> refreshed = post("/api/auth/refresh", "{\"refreshToken\":\"" + demo.refreshToken + "\"}", null);
        assertEquals(200, refreshed.statusCode());
        JsonNode node = objectMapper.readTree(refreshed.body());
        String newRefresh = node.path("refreshToken").asText();

        HttpResponse<String> oldRefreshReuse = post("/api/auth/refresh", "{\"refreshToken\":\"" + demo.refreshToken + "\"}", null);
        assertEquals(401, oldRefreshReuse.statusCode());

        HttpResponse<String> newRefreshUse = post("/api/auth/refresh", "{\"refreshToken\":\"" + newRefresh + "\"}", null);
        assertEquals(200, newRefreshUse.statusCode());
    }

    @Test
    void userCanCancelOwnAppointment() throws Exception {
        AuthData demo = login("demo@healthcare.local", "demo123");
        long doctorId = firstDoctorId();
        long appointmentId = createAppointment(demo, doctorId, LocalDate.now().plusDays(1));

        HttpResponse<String> cancelResponse = delete("/api/appointments/" + appointmentId, demo.accessToken);
        assertEquals(200, cancelResponse.statusCode());
        assertEquals("CANCELLED", objectMapper.readTree(cancelResponse.body()).path("status").asText());
    }

    @Test
    void userCannotCancelAnotherUsersAppointment() throws Exception {
        AuthData demo = login("demo@healthcare.local", "demo123");
        AuthData other = register("Other User", "other+" + UUID.randomUUID() + "@mail.local", "pass12345");
        long doctorId = firstDoctorId();
        long appointmentId = createAppointment(other, doctorId, LocalDate.now().plusDays(1));

        HttpResponse<String> cancelResponse = delete("/api/appointments/" + appointmentId, demo.accessToken);
        assertEquals(403, cancelResponse.statusCode());
    }

    @Test
    void appointmentCreateShouldRejectPastDate() throws Exception {
        AuthData demo = login("demo@healthcare.local", "demo123");
        long doctorId = firstDoctorId();

        String payload = """
                {
                  "userId": %d,
                  "doctorId": %d,
                  "date": "%s",
                  "time": "09:00:00",
                  "reason": "Routine check"
                }
                """.formatted(demo.userId, doctorId, LocalDate.now().minusDays(1));

        HttpResponse<String> response = post("/api/appointments", payload, demo.accessToken);
        assertEquals(400, response.statusCode());
    }

    @Test
    void appointmentStatusUpdateShouldRequireAdminRole() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long doctorId = firstDoctorId();
        long appointmentId = createAppointment(patient, doctorId, LocalDate.now().plusDays(1));

        String payload = """
                {
                  "status": "CONFIRMED"
                }
                """;

        HttpResponse<String> forbidden = put("/api/appointments/" + appointmentId + "/status", payload, patient.accessToken);
        assertEquals(403, forbidden.statusCode());

        HttpResponse<String> updated = put("/api/appointments/" + appointmentId + "/status", payload, admin.accessToken);
        assertEquals(200, updated.statusCode());
        assertEquals("CONFIRMED", objectMapper.readTree(updated.body()).path("status").asText());
    }

    @Test
    void appointmentStatusUpdateShouldRejectInvalidStatus() throws Exception {
        AuthData patient = login("demo@healthcare.local", "demo123");
        AuthData admin = login("admin@healthcare.local", "admin123");
        long doctorId = firstDoctorId();
        long appointmentId = createAppointment(patient, doctorId, LocalDate.now().plusDays(1));

        String payload = """
                {
                  "status": "DONE"
                }
                """;

        HttpResponse<String> invalid = put("/api/appointments/" + appointmentId + "/status", payload, admin.accessToken);
        assertEquals(400, invalid.statusCode());
    }

    private AuthData register(String fullName, String email, String password) throws Exception {
        String payload = """
                {
                  "fullName": "%s",
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(fullName, email, password);

        HttpResponse<String> response = post("/api/auth/register", payload, null);
        JsonNode node = objectMapper.readTree(response.body());
        return new AuthData(
                node.path("token").asText(),
                node.path("refreshToken").asText(),
                node.path("user").path("id").asLong()
        );
    }

    private AuthData login(String email, String password) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("email", email, "password", password));
        HttpResponse<String> response = post("/api/auth/login", payload, null);
        JsonNode node = objectMapper.readTree(response.body());
        return new AuthData(
                node.path("token").asText(),
                node.path("refreshToken").asText(),
                node.path("user").path("id").asLong()
        );
    }

    private long firstDoctorId() throws Exception {
        HttpResponse<String> response = get("/api/doctors", null);
        JsonNode array = objectMapper.readTree(response.body());
        return array.get(0).path("id").asLong();
    }

    private long createAppointment(AuthData auth, long doctorId, LocalDate date) throws Exception {
        String payload = """
                {
                  "userId": %d,
                  "doctorId": %d,
                  "date": "%s",
                  "time": "09:00:00",
                  "reason": "Routine check"
                }
                """.formatted(auth.userId, doctorId, date.toString());

        HttpResponse<String> response = post("/api/appointments", payload, auth.accessToken);
        assertEquals(200, response.statusCode());
        JsonNode node = objectMapper.readTree(response.body());
        return node.path("id").asLong();
    }

    private long createDoctor(String accessToken, String name) throws Exception {
        String payload = """
                {
                  "name": "%s",
                  "specialty": "General Medicine",
                  "rating": 4.2
                }
                """.formatted(name);

        HttpResponse<String> response = post("/api/doctors", payload, accessToken);
        assertEquals(200, response.statusCode());
        return objectMapper.readTree(response.body()).path("id").asLong();
    }

    private long createHospital(String accessToken, String name) throws Exception {
        String payload = """
                {
                  "name": "%s",
                  "address": "Delete City",
                  "phone": "+1-123-123-1234",
                  "lat": 10.0,
                  "lng": 20.0
                }
                """.formatted(name);

        HttpResponse<String> response = post("/api/hospitals", payload, accessToken);
        assertEquals(200, response.statusCode());
        return objectMapper.readTree(response.body()).path("id").asLong();
    }

    private HttpResponse<String> post(String path, String body, String bearerToken) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (bearerToken != null) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> delete(String path, String bearerToken) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .DELETE();
        if (bearerToken != null) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> put(String path, String body, String bearerToken) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(body));
        if (bearerToken != null) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path, String bearerToken) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .GET();
        if (bearerToken != null) {
            builder.header("Authorization", "Bearer " + bearerToken);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private record AuthData(String accessToken, String refreshToken, long userId) {}
}
