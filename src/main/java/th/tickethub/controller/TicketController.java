package th.tickethub.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import th.tickethub.model.Ticket;
import th.tickethub.repository.TicketRepository;

import java.util.List;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @PostMapping("/create")
    public Ticket createTicket(@RequestParam String seatNumber) {
        Ticket ticket = new Ticket();
        ticket.setSeatNumber(seatNumber);
        ticket.setSold(false);
        ticket.setOwnerName(null);
        return ticketRepository.save(ticket);
    }

    @PostMapping("/book")
    public String bootTicket(@RequestParam String seatNumber, @RequestParam String user, @RequestParam String userId) {
        Ticket ticket = ticketRepository.findBySeatNumber(seatNumber)
                .orElseThrow(() -> new RuntimeException("Seat not found: " + seatNumber));

        if (ticket.isSold()) {
            return "FAILED: Seat " + seatNumber + " is already taken by " + ticket.getOwnerName();
        }

        ticket.setSold(true);
        ticket.setOwnerName(user);
        ticket.setOwnerId(userId);
        ticketRepository.save(ticket);

        return "SUCCESS: " + user + " booked " + seatNumber;
    }
}
