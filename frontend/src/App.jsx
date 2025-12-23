import { useState, useEffect } from 'react'
import axios from 'axios'
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import Login from './Login';
import './App.css'

const API_URL = "http://localhost:8080/tickets";
const WS_URL = "http://localhost:8080/ws"; // The WebSocket Endpoint

function App() {
    const [user, setUser] = useState(null);
    const [seats, setSeats] = useState([]);
    const [log, setLog] = useState("");

    const handleLogout = () => {
        setUser(null);
        setLog("");
    };

    useEffect(() => {
        //  Connect to WebSocket only if a user is logged in!
        if (!user) return;

        fetchSeats();

        const socket = new SockJS(WS_URL);
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            setLog("Connected to Real-Time Server");

            // Subscribe to Updates
            stompClient.subscribe('/topic/seats', (message) => {
                const soldSeatNumber = message.body;
                setLog(`Real-time update: Seat ${soldSeatNumber} just sold!`);

                // Update the Grid instantly
                setSeats(currentSeats =>
                    currentSeats.map(seat =>
                        seat.seatNumber === soldSeatNumber ? { ...seat, sold: true } : seat
                    )
                );
            });
        });

        // Cleanup on close
        return () => {
            if (stompClient && stompClient.ws && stompClient.ws.readyState === 1) {
                stompClient.disconnect();
            }
        };
    }, [user]); // Re-run this effect when 'user' changes

    const fetchSeats = async () => {
        try {
            const response = await axios.get(API_URL);
            setSeats(response.data.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
        } catch (error) {
            console.error("Error fetching seats:", error);
        }
    };

    const bookSeat = async (seatNumber) => {
        if (!user) return; // Guard clause

        setLog(`Attempting to book ${seatNumber}...`);
        try {
            const params = new URLSearchParams();
            params.append('seatNumber', seatNumber);
            // USE THE REAL USERNAME AND ID NOW!
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

    if (!user) {
        return <Login onLoginSuccess={setUser} />;
    }

    return (
        <div className="container">
            <h1>TicketHub Live 🎟️</h1>
            <div className="user-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Welcome, <strong>{user.username}</strong></span>
                <button className="seat available" style={{ width: '80px', height: '30px', fontSize: '0.8rem' }} onClick={handleLogout}>Logout</button>
            </div>

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

            <div className="log-panel">
                <h3>System Log:</h3>
                <p>{log}</p>
            </div>
        </div>
    )
}

export default App