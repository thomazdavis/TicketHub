package th.tickethub.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import th.tickethub.model.Ticket;
import th.tickethub.service.TicketService;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = "*") // allowing all connection for dev
public class TicketController {

    @Autowired
    private TicketService ticketService;

    // Used by the "Stage" view to load seats for the selected concert
    @GetMapping
    public List<Ticket> getTicketsByEvent(@RequestParam Long eventId) {
        return ticketService.getTicketsByEvent(eventId);
    }

    // Used when a user clicks a seat
    @PostMapping("/book")
    public String bookTicket(@RequestParam String seatNumber,
                             @RequestParam Long eventId,
                             @RequestParam String user,
                             @RequestParam String userId) {
        try {
            return ticketService.bookTicket(seatNumber, eventId, user, userId);
        } catch (RuntimeException e) {
            return "Error: " + e.getMessage();
        }
    }

    // Used by the "My Wallet" view
    @GetMapping("/my-tickets")
    public List<Ticket> getMyTickets(@RequestParam String userId) {
        return ticketService.getTicketsByUser(userId);
    }

    // Used for Testing/Demo purposes to wipe data
    @PostMapping("/reset")
    public String reset() {
        ticketService.resetDatabase();
        return "Database Cleared";
    }
}