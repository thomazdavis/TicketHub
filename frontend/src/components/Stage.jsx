import './Stage.css';

function Stage({ event, seats, onBook, onBack, log }) {
    return (
        <div className="stage-view">
            <button className="back-btn" onClick={onBack}>← Back to Events</button>
            <div className="stage">___ {event.name} @ {event.venue} ___</div>

            <div className="seat-grid">
                {seats.map((seat) => (
                    <button
                        key={seat.id}
                        className={`seat ${seat.sold ? 'sold' : 'available'}`}
                        onClick={() => !seat.sold && onBook(seat.seatNumber)}
                        disabled={seat.sold}
                    >
                        {seat.seatNumber}
                    </button>
                ))}
            </div>

            <div className="log-panel" style={{ marginTop: '30px' }}>
                <h3>System Log:</h3>
                <p>{log}</p>
            </div>
        </div>
    );
}

export default Stage;