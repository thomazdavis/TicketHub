package th.tickethub;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class StressTest {

    private static final String BASE_URL = "http://localhost:8080/tickets";
    private static final String SEAT_NUMBER = "A1";
    private static final int THREAD_COUNT = 100; // Simulate 100 concurrent users

    public static void main(String[] args) throws InterruptedException {

        System.out.println("--- SETUP: Clearing Database ---");
        sendPostRequest("/reset");

        System.out.println("--- SETUP: Creating Seat " + SEAT_NUMBER + " ---");
        sendPostRequest("/create?seatNumber=" + SEAT_NUMBER);

        // 2. The Stress Test
        System.out.println("\n--- STARTING STRESS TEST (Flash Sale Simulation) ---");
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        AtomicInteger dbErrorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < THREAD_COUNT; i++) {
            int userId = i;
            executor.submit(() -> {
                String response = sendPostRequest("/book?seatNumber=" + SEAT_NUMBER + "&user=User" + userId + "&userId=" + userId);

                if (response.contains("SUCCESS")) {
                    successCount.incrementAndGet();
                    System.out.println("User " + userId + ": GOT IT!");
                } else if (response.contains("FAILED")) {
                    failCount.incrementAndGet(); // Polite "Already taken" message
                } else {
                    dbErrorCount.incrementAndGet(); // Ugly DB errors
                    System.out.println("User " + userId + ": CRASH/ERROR -> " + response);
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();

        // 3. The Report Card
        System.out.println("\n--- RESULTS ---");
        System.out.println("Time taken: " + (endTime - startTime) + "ms");
        System.out.println("Successful Bookings: " + successCount.get() + " (Should be exactly 1)");
        System.out.println("Polite 'Sold Out' messages: " + failCount.get());
        System.out.println("Ugly DB Errors (Race Conditions): " + dbErrorCount.get());

        if (successCount.get() > 1) {
            System.out.println("CRITICAL FAIL: Double Booking occurred!");
        } else if (dbErrorCount.get() > 0) {
            System.out.println("UX FAIL: Users saw database errors (Optimistic Locking Exceptions).");
        } else {
            System.out.println("PERFECTION: System handled concurrency gracefully.");
        }
    }

    private static String sendPostRequest(String path) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + path))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return "Exception: " + e.getMessage();
        }
    }
}