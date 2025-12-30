package th.tickethub.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import th.tickethub.model.Event;
import th.tickethub.repository.EventRepository;

import java.util.List;

@RestController
@RequestMapping("/events")
@CrossOrigin(origins = "*")
public class EventController {
    @Autowired
    private EventRepository eventRepository;

    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
}