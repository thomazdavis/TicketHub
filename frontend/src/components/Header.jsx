import { useState } from 'react';
import './Header.css';

function Header({ user, onLogout, onNavigate }) {
    const [showMenu, setShowMenu] = useState(false);

    const handleNav = (view) => {
        onNavigate(view);
        setShowMenu(false);
    };

    return (
        <div className="header">
            <h1 style={{ margin: 0, cursor: 'pointer', fontSize: '1.5rem' }}
                onClick={() => handleNav('events')}>
                TicketHub 🎟️
            </h1>

            <div style={{ position: 'relative' }}>
                <div
                    className="user-avatar"
                    onClick={() => setShowMenu(!showMenu)}
                    title={user.username}
                >
                    {user.username.charAt(0).toUpperCase()}
                </div>

                {showMenu && (
                    <div className="user-menu-dropdown">
                        <div className="menu-item" onClick={() => handleNav('events')}>Events</div>
                        {/* We use a simple callback to check if stage is allowed in App, or just show it */}
                        <div className="menu-item" onClick={() => handleNav('stage')}>Stage</div>
                        <div className="menu-item" onClick={() => handleNav('tickets')}>My Tickets</div>
                        <div className="menu-item logout" onClick={onLogout}>Logout</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;