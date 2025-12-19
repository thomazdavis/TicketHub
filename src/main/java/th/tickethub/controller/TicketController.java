package th.tickethub.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTicket(@RequestParam String seatNumber) {
        try {
            Ticket ticket = ticketService.createTicket(seatNumber);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/book")
    public String bookTicket(@RequestParam String seatNumber, @RequestParam String user, @RequestParam String userId) {
        try {
            return ticketService.bookTicket(seatNumber, user, userId);
        } catch (RuntimeException e) {
            return "Error: " + e.getMessage();
        }
    }

    // WARNING: For testing only! Never put this in production.
    @PostMapping("/reset")
    public String reset() {
        ticketService.resetDatabase();
        return "Database Cleared";
    }
}