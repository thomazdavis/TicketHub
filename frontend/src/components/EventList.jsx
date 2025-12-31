import './EventList.css';

function EventList({ events, onSelectEvent }) {
    if (events.length === 0) {
        return (
            <div className="events-page">
                <h2>Upcoming Events</h2>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>No events found.</p>
                    <small>Use the Admin API to create some!</small>
                </div>
            </div>
        );
    }

    return (
        <div className="events-page">
            <h2>Upcoming Events</h2>
            <div className="event-list" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {events.map(event => (
                    <div key={event.id} className="event-card" onClick={() => onSelectEvent(event)}
                         style={{
                             border: '1px solid #ddd', borderRadius: '10px', padding: '20px',
                             width: '220px', cursor: 'pointer', background: 'white',
                             boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center',
                             transition: 'transform 0.2s'
                         }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎵</div>
                        <h3 style={{ margin: '10px 0' }}>{event.name}</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>{event.venue}</p>
                        <p style={{ color: '#888', fontSize: '0.8rem' }}>
                            {new Date(event.date).toLocaleDateString()}
                        </p>
                        <button className="seat available" style={{ width: '100%', marginTop: '10px' }}>View Seats</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventList;