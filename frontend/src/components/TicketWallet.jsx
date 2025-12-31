import './TicketWallet.css';

function TicketWallet({ tickets, onBack }) {
    return (
        <div className="tickets-page">
            <div className="wallet-header">
                <button className="back-btn" onClick={onBack}>← Back to Events</button>
                <h2>My Wallet</h2>
            </div>

            {tickets.length === 0 ? (
                <div style={{ padding: '40px', background: '#fff', borderRadius: '8px', textAlign: 'center', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <p style={{color: '#666', fontSize: '1.1rem'}}>You haven't booked any seats yet.</p>
                    <button className="seat available" onClick={onBack} style={{ marginTop: '15px', padding: '10px 20px', width: 'auto' }}>Browse Events</button>
                </div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                    {tickets.map(ticket => (
                        <li key={ticket.id} className="ticket-item">

                            {/* LEFT SIDE: Info */}
                            <div className="ticket-info">
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>
                                    Seat {ticket.seatNumber}
                                </div>
                                <div style={{ color: '#555', fontSize: '1rem', marginTop: '5px', fontWeight: '500' }}>
                                    {ticket.event ? ticket.event.name : "Event Data Not Available"}
                                </div>
                                <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '2px' }}>
                                    {ticket.event ? ticket.event.venue : ""}
                                </div>
                            </div>

                            {/* RIGHT SIDE: Badge (Now forced apart by 'gap') */}
                            <div className="ticket-status">
                                CONFIRMED
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TicketWallet;