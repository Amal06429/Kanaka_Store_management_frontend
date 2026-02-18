import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import './Login.scss';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      console.log('Login: Attempting login for user:', username);
      const response = await authAPI.login(username, password);
      console.log('Login: Response received:', response);
      
      if (response.user) {
        console.log('Login: Setting user in context:', response.user);
        login(response.user);
        
        if (response.user.role === 'admin') {
          console.log('Login: Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('Login: Redirecting to user dashboard');
          navigate('/user/dashboard');
        }
      }
    } catch (error) {
      console.error('Login: Error during login:', error);
      setError(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="logo-wrapper">
            <div className="logo-circle">
              <svg className="shopping-bag-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Shopping bag outline */}
                <path d="M 20 35 L 25 85 C 25 88 27 90 30 90 L 70 90 C 73 90 75 88 75 85 L 80 35 Z" 
                      fill="none" 
                      stroke="#D4AF37" 
                      strokeWidth="3" 
                      strokeLinejoin="round"/>
                {/* Bag handles */}
                <path d="M 35 35 C 35 25 40 20 50 20 C 60 20 65 25 65 35" 
                      fill="none" 
                      stroke="#D4AF37" 
                      strokeWidth="3" 
                      strokeLinecap="round"/>
                {/* K letter */}
                <text x="50" y="65" 
                      fontSize="32" 
                      fontWeight="700" 
                      fill="#D4AF37" 
                      textAnchor="middle" 
                      fontFamily="Georgia, serif">K</text>
              </svg>
            </div>
          </div>
          <h1 className="brand-name">KANAKA</h1>
          
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-box">
          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-subtitle">Sign in to continue to your account</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
