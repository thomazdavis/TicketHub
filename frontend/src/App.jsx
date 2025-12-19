import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = "http://localhost:8080/tickets";

function App() {
    const [seats, setSeats] = useState([]);
    const [currentUser, _] = useState("User-" + Math.floor(Math.random() * 1000));
    const [log, setLog] = useState("");

    // Load Seats on Startup
    useEffect(() => {
        fetchSeats();
        // Poll every 2 seconds to see updates
        const interval = setInterval(fetchSeats, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await axios.get(API_URL);
            // If the DB is empty, the array might be empty.
            // For now, we assume seats exist.
            setSeats(response.data.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
        } catch (error) {
            console.error("Error fetching seats:", error);
        }
    };

    // Handle Booking
    const bookSeat = async (seatNumber) => {
        setLog(`Attempting to book ${seatNumber}...`);
        try {
            // URLSearchParams because  backend expects @RequestParam
            const params = new URLSearchParams();
            params.append('seatNumber', seatNumber);
            params.append('user', currentUser);
            params.append('userId', currentUser); // Using name as ID for simplicity

            const response = await axios.post(`${API_URL}/book`, null, { params });

            if (response.data.includes("SUCCESS")) {
                setLog(`✅ Success! You booked ${seatNumber}`);
                fetchSeats(); // Refresh immediately
            } else {
                setLog(`❌ Failed: ${response.data}`);
            }
        } catch (error) {
            setLog(`⚠️ Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    return (
        <div className="container">
            <h1>TicketHub Live 🎟️</h1>
            <div className="user-panel">
                Acting as: <strong>{currentUser}</strong>
            </div>

            <div className="stage">___ STAGE ___</div>

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
                {seats.length === 0 && <p>No seats found. Use Postman to /create some!</p>}
            </div>

            <div className="log-panel">
                <h3>System Log:</h3>
                <p>{log}</p>
            </div>
        </div>
    )
}

export default App