import React, { useState } from 'react';
import { Lock, LayoutDashboard } from 'lucide-react';
import { ADMIN_PASSWORD } from '../constants';

const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            onLogin();
        } else {
            setError('Invalid password. Please try again.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-panel animate-fade" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--primary)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <LayoutDashboard size={32} color="white" />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Event Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Secure access to dashboard</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="field-group">
                        <label>Master Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="password"
                                className="input"
                                style={{ paddingLeft: '40px' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Enter Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
