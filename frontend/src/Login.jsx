import { useState } from "react";
import axios from "axios";
import './App.css';
import './Login.css';

const API_URL = "http://localhost:8080/auth";

function Login({ onLoginSuccess }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setMessage("");

        const endpoint = isRegistering ? "/register" : "/login";

        try {
            const response = await axios.post(`${API_URL}${endpoint}`, { username, password });
            if (response.status === 200) {
                // Check if the response is just a string or JSON
                if (typeof response.data === 'string' && isRegistering) {
                    setMessage("Registration successful! Please log in.");
                    setIsRegistering(false);
                } else {
                    onLoginSuccess(response.data);
                }
            }
        } catch (error) {
            setMessage(error.response ? error.response.data : "Authentication failed");
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h1 className="login-title">TicketHub {isRegistering ? "Register" : "Login"}</h1>

                <form onSubmit={handleAuth} className="login-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {message && <div className="error-message">{message}</div>}

                    <button type="submit" className="auth-btn">
                        {isRegistering ? "Sign Up" : "Log In"}
                    </button>
                </form>

                <div className="toggle-link" onClick={() => {
                    setIsRegistering(!isRegistering);
                    setMessage("");
                }}>
                    {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
                </div>
            </div>
        </div>
    );
}

export default Login;