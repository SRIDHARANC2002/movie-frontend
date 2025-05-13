import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSearch,
  faHeart,
  faSignInAlt,
  faUserPlus,
  faSignOutAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { logoutAndClearFavorites } from "../../../store/Slices/auth";
import "./../Styles/Navbar.css";

export default function Navbar() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});

  // Safely access favorites with fallback to empty array
  const favorites = useSelector((state) => {
    return state.favorites?.movies || [];
  });

  const handleLogout = () => {
    dispatch(logoutAndClearFavorites());
  };

  // Get display name for the user
  const getDisplayName = () => {
    if (!user) return 'Profile';
    return user.fullName || user.name || user.email.split('@')[0];
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand multicolor-text" to={isAuthenticated ? "/home" : "/login"}>
          Tamil Movie
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/home">
                    <FontAwesomeIcon icon={faHome} className="me-2" /> Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/search">
                    <FontAwesomeIcon icon={faSearch} className="me-2" /> Search
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/favorites">
                    <FontAwesomeIcon icon={faHeart} className="me-2" />
                    Favorites
                    {favorites.length > 0 && (
                      <span className="badge bg-danger ms-1">{favorites.length}</span>
                    )}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" /> Register
                  </Link>
                </li>
              </>
            )}
          </ul>
          {isAuthenticated && (
            <div className="navbar-nav">
              <Link to="/user" className="nav-link d-flex align-items-center me-3">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="profile-pic me-2"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                )}
                {getDisplayName()}
              </Link>
              <button
                className="btn btn-outline-light"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
