import { useState, useEffect } from 'react'
import axios from 'axios'
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import Login from './Login';
import './App.css'

const API_URL = "http://localhost:8080/tickets";
const WS_URL = "http://localhost:8080/ws";

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [currentView, setCurrentView] = useState('stage');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const [seats, setSeats] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [log, setLog] = useState("");

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
        setCurrentView('stage');
    };

    const fetchMyTickets = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${API_URL}/my-tickets?userId=${user.id}`);
            setMyTickets(response.data);
        } catch (error) {
            console.error("Error fetching my tickets", error);
        }
    };

    const fetchSeats = async () => {
        try {
            const response = await axios.get(API_URL);
            setSeats(response.data.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
        } catch (error) {
            console.error("Error fetching seats:", error);
        }
    };

    // WebSocket & Initial Data Load
    useEffect(() => {
        if (!user) return;

        fetchSeats();
        fetchMyTickets();

        const socket = new SockJS(WS_URL);
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            setLog("Connected to Real-Time Server");

            stompClient.subscribe('/topic/seats', (message) => {
                const soldSeatNumber = message.body;
                setLog(`Update: Seat ${soldSeatNumber} sold!`);

                // Update the Grid instantly
                setSeats(currentSeats =>
                    currentSeats.map(seat =>
                        seat.seatNumber === soldSeatNumber ? { ...seat, sold: true } : seat
                    )
                );
                // Refresh my tickets in case I was the one who bought it
                fetchMyTickets();
            });
        });

        return () => {
            if (stompClient && stompClient.ws && stompClient.ws.readyState === 1) {
                stompClient.disconnect();
            }
        };
    }, [user]);

    const bookSeat = async (seatNumber) => {
        if (!user) return;

        setLog(`Attempting to book ${seatNumber}...`);
        try {
            const params = new URLSearchParams();
            params.append('seatNumber', seatNumber);
            params.append('user', user.username);
            params.append('userId', user.id);

            const response = await axios.post(`${API_URL}/book`, null, { params });

            if (response.data.includes("SUCCESS")) {
                setLog(`Success! You booked ${seatNumber}`);
                fetchSeats();
            } else {
                setLog(`Failed: ${response.data}`);
            }
        } catch (error) {
            setLog(`Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    const goToTickets = () => {
        setCurrentView('tickets');
        setShowUserMenu(false);
    };

    const goToStage = () => {
        setCurrentView('stage');
        setShowUserMenu(false); // Close menu if open
    };


    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <>
            <header className="header">
                <h1 style={{ margin: 0, cursor: 'pointer', fontSize: '1.5rem' }} onClick={goToStage}>
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
                            <div className="menu-item" onClick={goToTickets}>
                                My Tickets
                            </div>
                            <div className="menu-item" onClick={goToStage}>
                                Stage
                            </div>
                            <div className="menu-item logout" onClick={handleLogout}>
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="container">

                {/* --- VIEW: STAGE --- */}
                {currentView === 'stage' && (
                    <div className="stage-view">
                        <div className="stage">___ STAGE (Event A) ___</div>

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
                    </div>
                )}

                {/* --- VIEW: MY TICKETS --- */}
                {currentView === 'tickets' && (
                    <div className="tickets-page">
                        <button className="back-btn" onClick={goToStage}>
                            <span>←</span> Back to Stage
                        </button>

                        <h2>My Tickets</h2>

                        {myTickets.length === 0 ? (
                            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', width: '100%' }}>
                                <p>You haven't booked any seats yet.</p>
                                <button className="seat available" onClick={goToStage} style={{width: 'auto', padding: '0 20px', margin: '0 auto'}}>
                                    Find Seats
                                </button>
                            </div>
                        ) : (
                            <ul>
                                {myTickets.map(ticket => (
                                    <li key={ticket.id} className="ticket-item">
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Seat {ticket.seatNumber}</div>
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
            </main>
        </>
    )
}

export default App