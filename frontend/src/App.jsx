import { useState, useEffect } from 'react'
import axios from 'axios'
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import Login from './Login';
import './App.css'

const BASE_URL = "http://localhost:8080";
const API_URL = `${BASE_URL}/tickets`;
const EVENT_URL = `${BASE_URL}/events`;
const WS_URL = `${BASE_URL}/ws`;

function App() {
    // --- 1. USER STATE ---
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // --- 2. VIEW STATE ('events' | 'stage' | 'tickets') ---
    const [currentView, setCurrentView] = useState('events');
    const [showUserMenu, setShowUserMenu] = useState(false);

    // --- 3. DATA STATE ---
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [seats, setSeats] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [log, setLog] = useState("");

    // --- AUTH HANDLERS ---
    const handleLoginSuccess = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        setLog("");
        setMyTickets([]);
        setShowUserMenu(false);
        setCurrentView('events');
        setSelectedEvent(null);
    };

    // --- API CALLS ---

    // Load Event List (Landing Page)
    useEffect(() => {
        if (user) {
            axios.get(EVENT_URL)
                .then(res => setEvents(res.data))
                .catch(err => console.error("Error fetching events:", err));
        }
    }, [user]);

    // Load My Tickets (Wallet)
    const fetchMyTickets = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${API_URL}/my-tickets?userId=${user.id}`);
            setMyTickets(response.data);
        } catch (error) {
            console.error("Error fetching my tickets", error);
        }
    };

    // Load Seats for Selected Event
    const fetchSeats = async (eventId) => {
        try {
            const response = await axios.get(`${API_URL}?eventId=${eventId}`);
            setSeats(response.data.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
        } catch (error) {
            console.error("Error fetching seats:", error);
        }
    };

    // --- WEBSOCKET CONNECTION ---
    useEffect(() => {
        if (!user) return;

        fetchMyTickets(); // Load wallet on startup

        const socket = new SockJS(WS_URL);
        const stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logs

        stompClient.connect({}, () => {
            setLog("Connected to Real-Time Server");

            stompClient.subscribe('/topic/seats', (message) => {
                const payload = JSON.parse(message.body);

                if (selectedEvent && selectedEvent.id === payload.eventId) {
                    setSeats(currentSeats =>
                        currentSeats.map(seat =>
                            seat.seatNumber === payload.seatNumber ? { ...seat, sold: true } : seat
                        )
                    );
                }

                // Refresh my tickets (in case I was the one who bought it)
                fetchMyTickets();
            });
        });

        return () => {
            if (stompClient && stompClient.ws && stompClient.ws.readyState === 1) {
                stompClient.disconnect();
            }
        };
    }, [user]);

    // --- ACTIONS ---

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setCurrentView('stage');
        fetchSeats(event.id);
    };

    const bookSeat = async (seatNumber) => {
        if (!user || !selectedEvent) return;

        setLog(`Attempting to book ${seatNumber}...`);
        try {
            const params = new URLSearchParams();
            params.append('seatNumber', seatNumber);
            params.append('eventId', selectedEvent.id); // <--- Critical: Pass Event ID
            params.append('user', user.username);
            params.append('userId', user.id);

            const response = await axios.post(`${API_URL}/book`, null, { params });

            if (response.data.includes("SUCCESS")) {
                setLog(`Success! You booked ${seatNumber}`);
                fetchSeats(selectedEvent.id);
                fetchMyTickets();
            } else {
                setLog(`Failed: ${response.data}`);
            }
        } catch (error) {
            setLog(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    // --- NAVIGATION HELPERS ---
    const goToStage = () => {
        if (selectedEvent) setCurrentView('stage');
        else setCurrentView('events');
        setShowUserMenu(false);
    };

    const goToEvents = () => {
        setCurrentView('events');
        setShowUserMenu(false);
    };

    const goToTickets = () => {
        setCurrentView('tickets');
        setShowUserMenu(false);
    };

    // --- RENDER ---
    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="container">
            {/* --- HEADER --- */}
            <div className="header">
                <h1 style={{margin: 0, cursor: 'pointer', fontSize: '1.5rem'}} onClick={goToEvents}>
                    TicketHub 🎟️
                </h1>

                <div style={{ position: 'relative' }}>
                    <div
                        className="user-avatar"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        title={user.username}
                    >
                        {user.username.charAt(0).toUpperCase()}
                    </div>

                    {showUserMenu && (
                        <div className="user-menu-dropdown">
                            <div className="menu-item" onClick={goToEvents}>Events</div>
                            {selectedEvent && <div className="menu-item" onClick={goToStage}>Stage</div>}
                            <div className="menu-item" onClick={goToTickets}>My Tickets</div>
                            <div className="menu-item logout" onClick={handleLogout}>Logout</div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- VIEW 1: EVENTS LIST --- */}
            {currentView === 'events' && (
                <div className="events-page">
                    <h2>Upcoming Events</h2>
                    {events.length === 0 ? (
                        <div style={{textAlign: 'center', color: '#666'}}>
                            <p>No events found.</p>
                            <small>Use the Admin API to create some!</small>
                        </div>
                    ) : (
                        <div className="event-list" style={{display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
                            {events.map(event => (
                                <div key={event.id} className="event-card" onClick={() => handleEventSelect(event)}
                                     style={{
                                         border: '1px solid #ddd',
                                         borderRadius: '10px',
                                         padding: '20px',
                                         width: '220px',
                                         cursor: 'pointer',
                                         background: 'white',
                                         boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                         textAlign: 'center',
                                         transition: 'transform 0.2s'
                                     }}
                                >
                                    <div style={{fontSize: '3rem', marginBottom: '10px'}}>🎵</div>
                                    <h3 style={{margin: '10px 0'}}>{event.name}</h3>
                                    <p style={{color: '#666', fontSize: '0.9rem'}}>{event.venue}</p>
                                    <p style={{color: '#888', fontSize: '0.8rem'}}>
                                        {new Date(event.date).toLocaleDateString()}
                                    </p>
                                    <button className="seat available" style={{width: '100%', marginTop: '10px'}}>View Seats</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- VIEW 2: STAGE --- */}
            {currentView === 'stage' && selectedEvent && (
                <div className="stage-view">
                    <button className="back-btn" onClick={goToEvents}>← Back to Events</button>
                    <div className="stage">___ {selectedEvent.name} @ {selectedEvent.venue} ___</div>

                    <div className="seat-grid">
                        {seats.map((seat) => (
                            <button
                                key={seat.id}
                                className={`seat ${seat.sold ? 'sold' : 'available'}`}
                                onClick={() => !seat.sold && bookSeat(seat.seatNumber)}
                                disabled={seat.sold}
                            >
                                {seat.seatNumber}
                            </button>
                        ))}
                    </div>

                    <div className="log-panel" style={{marginTop: '30px'}}>
                        <h3>System Log:</h3>
                        <p>{log}</p>
                    </div>
                </div>
            )}

            {/* --- VIEW 3: MY TICKETS --- */}
            {currentView === 'tickets' && (
                <div className="tickets-page">
                    <button className="back-btn" onClick={goToEvents}>← Back to Events</button>
                    <h2>My Wallet</h2>

                    {myTickets.length === 0 ? (
                        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                            <p>You haven't booked any seats yet.</p>
                            <button className="seat available" onClick={goToEvents} style={{marginTop: '10px'}}>Browse Events</button>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {myTickets.map(ticket => (
                                <li key={ticket.id} style={{
                                    background: 'white',
                                    padding: '15px',
                                    marginBottom: '15px',
                                    borderLeft: '5px solid #2ecc71',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{textAlign: 'left'}}>
                                        <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>
                                            Seat {ticket.seatNumber}
                                        </div>
                                        {/* --- THE FIX IS HERE --- */}
                                        <div style={{color: '#666', fontSize: '0.9rem', marginTop: '4px'}}>
                                            {ticket.event ? ticket.event.name : "Event Data Not Available"}
                                        </div>
                                        <div style={{color: '#888', fontSize: '0.8rem'}}>
                                            {ticket.event ? ticket.event.venue : ""}
                                        </div>
                                    </div>
                                    <div style={{ background: '#e8f8f5', color: '#2ecc71', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        CONFIRMED
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

export default App