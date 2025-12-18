package th.tickethub.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import th.tickethub.model.Ticket;
import th.tickethub.repository.TicketRepository;

import java.util.List;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

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

    public String bookTicket(String seatNumber, String user, String userId) {
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