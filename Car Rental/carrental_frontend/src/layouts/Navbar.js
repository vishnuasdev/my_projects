import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import Button from '../components/ui/Button';

const Navbar = () => {
    const { user, logout, accounts, switchAccount } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const dropdownRef = useRef(null);
    const lastScrollY = useRef(0);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide navbar on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down
                setIsHidden(true);
            } else {
                // Scrolling up
                setIsHidden(false);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if user has internal administrative/agency/owner roles
    const isInternalRole = () => {
        if (!user) return false;
        const role = String(user.role || user.roles || '').toUpperCase();
        return role.includes('AGENCY') || role.includes('OWNER') || role.includes('ADMIN');
    };

    // Check if car icon should be shown
    const shouldShowCarIcon = () => {
        return !isInternalRole();
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        const role = String(user.role || user.roles || '').toUpperCase();
        if (role.includes('CUSTOMER')) return '/customer/dashboard';
        if (role.includes('AGENCY')) return '/agency/dashboard';
        if (role.includes('OWNER')) return '/owner/dashboard';
        if (role.includes('ADMIN')) return '/admin/dashboard';
        return '/login';
    };

    // Extract initial from user's email or name
    const getInitial = () => {
        if (user?.name) return user.name.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
    };

    const handleSwitchAccount = (accountKey) => {
        if (accountKey === String(user?.email || '').toLowerCase()) return;
        if (switchAccount(accountKey)) {
            setDropdownOpen(false);
            navigate('/');
        }
    };

    const homeDestination = user ? getDashboardPath() : '/';

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Left Brand Logo */}
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                <Link to={homeDestination} style={{ color: '#ffffff', textDecoration: 'none' }}>
                    CarRental System
                </Link>
            </div>

            {/* Right Action Items */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
                {/* Vehicles Icon - Shows in public view and for CUSTOMER only */}
                {shouldShowCarIcon() && (
                    <Link 
                        to={homeDestination} 
                        style={{ 
                            color: '#cbd5e1', 
                            textDecoration: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            fontWeight: '500',
                            transition: 'color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z"/>
                            <circle cx="7.5" cy="14.5" r="1.5"/>
                            <circle cx="16.5" cy="14.5" r="1.5"/>
                        </svg>
                        Vehicles
                    </Link>
                )}

                {user ? (
                    <>
                        <Link to={getDashboardPath()} style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '500' }}>
                            Dashboard
                        </Link>

                        {/* User Profile Avatar & Dropdown */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <div 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    minWidth: '40px',
                                    minHeight: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    border: '2px solid #64748b',
                                    boxSizing: 'border-box',
                                    flexShrink: 0
                                }}
                            >
                                {user.profileImage ? (
                                    <img 
                                        src={user.profileImage} 
                                        alt="Profile" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <span style={{ 
                                        fontWeight: '700', 
                                        fontSize: '1rem', 
                                        lineHeight: '1', 
                                        display: 'block', 
                                        textAlign: 'center',
                                        marginTop: '-1px' 
                                    }}>
                                        {getInitial()}
                                    </span>
                                )}
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '50px',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
                                    width: '180px',
                                    zIndex: 1000,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#f8fafc', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {user.email}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.role}</span>
                                    </div>
                                    <button 
                                        onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: 'transparent',
                                            color: '#cbd5e1',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Profile
                                    </button>
                                    {accounts.length > 1 && (
                                        <div style={{ borderTop: '1px solid #334155', padding: '0.5rem 0' }}>
                                            <div style={{ padding: '0.25rem 1rem', fontSize: '0.7rem', color: '#94a3b8' }}>Switch account</div>
                                            {accounts.map(account => (
                                                <button
                                                    key={account.key}
                                                    type="button"
                                                    onClick={() => handleSwitchAccount(account.key)}
                                                    style={{ width: '100%', padding: '0.5rem 1rem', backgroundColor: account.key === String(user?.email || '').toLowerCase() ? '#1e3a8a' : 'transparent', color: '#cbd5e1', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    {account.name || account.email}
                                                    <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>{account.role}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { setDropdownOpen(false); navigate('/login/add'); }}
                                        style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: 'transparent', color: '#60a5fa', border: 'none', borderTop: '1px solid #334155', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem' }}
                                    >
                                        + Add account
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: 'transparent',
                                            color: '#ef4444',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            borderTop: '1px solid #334155'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                            Register
                        </Button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;