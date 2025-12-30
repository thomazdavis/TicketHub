package th.tickethub.service;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import th.tickethub.model.Ticket;
import th.tickethub.repository.TicketRepository;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Ticket> getTicketsByEvent(Long eventId) {
        return ticketRepository.findByEventId(eventId);
    }

    public List<Ticket> getTicketsByUser(String userId) {
        return ticketRepository.findByOwnerId(userId);
    }

    // Clean DB for testing
    public void resetDatabase() {
        ticketRepository.deleteAll();
    }

    // The Core Booking Logic
    public String bookTicket(String seatNumber, Long eventId, String user, String userId) {
        // 1. Redis Distributed Lock
        // Key is unique per Event AND Seat.
        // Example: "lock:event:1:seat:A1"
        String lockKey = "lock:event:" + eventId + ":seat:" + seatNumber;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Try to acquire lock. Wait 0s, hold for 5s.
            boolean isLocked = lock.tryLock(0, 5, TimeUnit.SECONDS);
            if (!isLocked) {
                return "FAILED: Seat is currently being processed by someone else.";
            }

            Ticket ticket = ticketRepository.findBySeatNumberAndEventId(seatNumber, eventId)
                    .orElseThrow(() -> new RuntimeException("Seat " + seatNumber + " not found for Event " + eventId));

            if (ticket.isSold()) {
                return "FAILED: Seat " + seatNumber + " is already taken.";
            }

            ticket.setSold(true);
            ticket.setOwnerName(user);
            ticket.setOwnerId(userId);
            ticketRepository.save(ticket);

            // Real-time Notification
            messagingTemplate.convertAndSend("/topic/seats", seatNumber);

            return "SUCCESS: " + user + " booked " + seatNumber;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Error: Interrupted";
        } finally {
            // Release the lock!
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}