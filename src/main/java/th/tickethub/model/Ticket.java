package th.tickethub.model;

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

    @Column(unique = true, nullable = false)
    private String seatNumber;

    private String ownerName;
    private String ownerId;

    private boolean isSold;

    // To prevent 2 people from purchasing the same ticket
    @Version
    private Integer version;
}