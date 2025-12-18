package th.tickethub.service;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
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

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket createTicket(String seatNumber) {
        if (ticketRepository.findBySeatNumber(seatNumber).isPresent()) {
            throw new IllegalArgumentException("Error: Seat " + seatNumber + " already exists.");
        }

        Ticket ticket = new Ticket();
        ticket.setSeatNumber(seatNumber);
        ticket.setSold(false);
        return ticketRepository.save(ticket);
    }

    public void resetDatabase() {
        ticketRepository.deleteAll();
    }

    public String bookTicket(String seatNumber, String user, String userId) {
        // Get a lock for the specific seat
        RLock lock = redissonClient.getLock("lock:seat:" + seatNumber);

        try {
            // Try to acquire the lock.
            // waitTime = 0 (If locked, give up immediately! Don't wait in line.)
            // leaseTime = 5 (Keep lock for 5 seconds max, then auto-release if app crashes)
            boolean isLocked = lock.tryLock(0, 5, TimeUnit.SECONDS);

            if (!isLocked) {
                return "FAILED: Seat is currently being processed by someone else. (Redis Blocked)";
            }

            // --- CRITICAL SECTION (Only 1 user enters here) ---
            Ticket ticket = ticketRepository.findBySeatNumber(seatNumber)
                    .orElseThrow(() -> new RuntimeException("Seat not found"));

            if (ticket.isSold()) {
                return "FAILED: Seat " + seatNumber + " is already taken by " + ticket.getOwnerName();
            }

            ticket.setSold(true);
            ticket.setOwnerName(user);
            ticket.setOwnerId(userId);
            ticketRepository.save(ticket);

            return "SUCCESS: " + user + " booked " + seatNumber;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Error: Interrupted";
        } finally {
            // Unlock
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}