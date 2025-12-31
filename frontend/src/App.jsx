import { useState, useEffect } from 'react'
import axios from 'axios'
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import Login from './Login';
import Header from './components/Header';
import EventList from './components/EventList';
import Stage from './components/Stage';
import TicketWallet from './components/TicketWallet';
import './App.css'

const BASE_URL = "http://localhost:8080";
const API_URL = `${BASE_URL}/tickets`;
const EVENT_URL = `${BASE_URL}/events`;
const WS_URL = `${BASE_URL}/ws`;

function App() {
    // --- STATE ---
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [currentView, setCurrentView] = useState('events');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [seats, setSeats] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [log, setLog] = useState("");

    // --- AUTH ---
    const handleLoginSuccess = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        setLog("");
        setMyTickets([]);
        setCurrentView('events');
        setSelectedEvent(null);
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        if (user) {
            axios.get(EVENT_URL)
                .then(res => setEvents(res.data))
                .catch(err => console.error("Error fetching events:", err));
        }
    }, [user]);

    const fetchMyTickets = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${API_URL}/my-tickets?userId=${user.id}`);
            setMyTickets(response.data);
        } catch (error) {
            console.error("Error fetching my tickets", error);
        }
    };

    const fetchSeats = async (eventId) => {
        try {
            const response = await axios.get(`${API_URL}?eventId=${eventId}`);
            setSeats(response.data.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
        } catch (error) {
            console.error("Error fetching seats:", error);
        }
    };

    // --- WEBSOCKETS ---
    useEffect(() => {
        if (!user) return;

        fetchMyTickets();

        const socket = new SockJS(WS_URL);
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            setLog("🟢 Connected to Real-Time Server");

            stompClient.subscribe('/topic/seats', (message) => {
                const payload = JSON.parse(message.body);
                // Check if update belongs to current view
                if (selectedEvent && selectedEvent.id === payload.eventId) {
                    setSeats(currentSeats =>
                        currentSeats.map(seat =>
                            seat.seatNumber === payload.seatNumber ? { ...seat, sold: true } : seat
                        )
                    );
                }
                fetchMyTickets();
            });
        });

        return () => {
            if (stompClient && stompClient.ws && stompClient.ws.readyState === 1) {
                stompClient.disconnect();
            }
        };
    }, [user, selectedEvent]);

    // --- INTERACTION HANDLERS ---
    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setCurrentView('stage');
        fetchSeats(event.id);
    };

    const handleNavigation = (view) => {
        // Prevent going to stage if no event selected
        if (view === 'stage' && !selectedEvent) {
            alert("Please select an event first!");
            return;
        }
        setCurrentView(view);
    };

    const bookSeat = async (seatNumber) => {
        if (!user || !selectedEvent) return;
        setLog(`Attempting to book ${seatNumber}...`);
        try {
            const params = new URLSearchParams();
            params.append('seatNumber', seatNumber);
            params.append('eventId', selectedEvent.id);
            params.append('user', user.username);
            params.append('userId', user.id);

            const response = await axios.post(`${API_URL}/book`, null, { params });

            if (response.data.includes("SUCCESS")) {
                setLog(`✅ Success! You booked ${seatNumber}`);
                fetchSeats(selectedEvent.id);
                fetchMyTickets();
            } else {
                setLog(`❌ Failed: ${response.data}`);
            }
        } catch (error) {
            setLog(`⚠️ Error: ${error.response ? error.response.data : error.message}`);
        }
    };

    // --- MAIN RENDER ---
    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="container">
            <Header
                user={user}
                onLogout={handleLogout}
                onNavigate={handleNavigation}
            />

            <main>
                {currentView === 'events' && (
                    <EventList
                        events={events}
                        onSelectEvent={handleEventSelect}
                    />
                )}

                {currentView === 'stage' && selectedEvent && (
                    <Stage
                        event={selectedEvent}
                        seats={seats}
                        onBook={bookSeat}
                        onBack={() => setCurrentView('events')}
                        log={log}
                    />
                )}

                {currentView === 'tickets' && (
                    <TicketWallet
                        tickets={myTickets}
                        onBack={() => setCurrentView('events')}
                    />
                )}
            </main>
        </div>
    );
}

export default App;