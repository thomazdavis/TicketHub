package th.tickethub.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String seatNumber;

    private String ownerName;
    private String ownerId;

    private boolean isSold;

    // To prevent 2 people from purchasing the same ticket
    @Version
    private Integer version;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
}