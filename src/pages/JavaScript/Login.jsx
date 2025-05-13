import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearError } from "../../store/Slices/auth";
import "../Styles/Auth.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error: authError, isAuthenticated } = useSelector((state) => state.auth);

  // Check if user is already authenticated and add login-background class
  useEffect(() => {
    // Add login-background class to body
    document.body.classList.add('login-background');

    // Check if user is already authenticated
    if (isAuthenticated) {
      console.log('⚠️ User is already authenticated, redirecting to home page');
      navigate('/home');
    }

    // Remove the class when component unmounts
    return () => {
      document.body.classList.remove('login-background');
    };
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error messages when user starts typing
    if (localError) setLocalError('');

    // Also clear Redux error state
    if (authError) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any existing errors
    setLocalError('');
    if (authError) dispatch(clearError());

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      console.log('🔄 Attempting to log in with provided credentials...');
      const result = await dispatch(login(formData)).unwrap();

      if (result) {
        console.log('✅ Login successful, redirecting to home page');
        // Set a flag in sessionStorage to indicate this is a fresh login
        sessionStorage.setItem('freshLogin', 'true');

        // Navigate to the home page
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error('❌ Login failed:', error);

      // Convert Error object to string for display
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);

      // Set a local error state for display
      setLocalError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        {(localError || authError) && (
          <div className="auth-error">
            {localError || authError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Register here</span>
        </p>
      </div>
    </div>
  );
}
