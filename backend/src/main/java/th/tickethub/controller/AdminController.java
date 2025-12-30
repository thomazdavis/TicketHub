package th.tickethub.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import th.tickethub.model.Event;
import th.tickethub.model.Ticket;
import th.tickethub.model.User;
import th.tickethub.repository.EventRepository;
import th.tickethub.repository.TicketRepository;
import th.tickethub.repository.UserRepository;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TicketRepository ticketRepository;

    @PostMapping("/create-event")
    public ResponseEntity<?> createEvent(@RequestBody Event event, @RequestParam Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(403).body("Access Denied: You are not an Admin.");
        }

        return ResponseEntity.ok(eventRepository.save(event));
    }

    // Initialize Seats for an Event
    @PostMapping("/generate-seats")
    public ResponseEntity<?> generateSeats(@RequestParam Long eventId, @RequestParam Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(403).body("Access Denied.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Automate creating A1-A5, B1-B5
        String[] rows = {"A", "B", "C"};
        for (String row : rows) {
            for (int i = 1; i <= 5; i++) {
                Ticket t = new Ticket();
                t.setSeatNumber(row + i);
                t.setSold(false);
                t.setEvent(event); // Link to the specific show
                ticketRepository.save(t);
            }
        }
        return ResponseEntity.ok("Generated 15 seats for " + event.getName());
    }
}
