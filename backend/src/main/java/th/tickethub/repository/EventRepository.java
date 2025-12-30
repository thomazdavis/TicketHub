package th.tickethub.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import th.tickethub.model.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
}