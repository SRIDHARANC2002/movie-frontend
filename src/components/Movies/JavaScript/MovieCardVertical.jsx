import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToFavorites,
  removeFromFavorites,
  addToFavoritesAsync,
  removeFromFavoritesAsync
} from "../../../store/Slices/favorites";
import { PLACEHOLDER_POSTER } from "../../../utils/placeholderImage";
import '../Styles/MovieCardVertical.css';

export default function MovieCardVertical({ movie }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.movies);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  // Convert IDs to numbers for consistent comparison
  const isFavorite = favorites.some((m) => Number(m.id) === Number(movie.id));
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : PLACEHOLDER_POSTER;

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? (movie.vote_average * 10).toFixed(0) : 'N/A';

  const handleViewClick = (e) => {
    e.stopPropagation();
    navigate(`/movie/${movie.id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      const confirmLogin = window.confirm('Please log in to add movies to favorites. Would you like to log in?');
      if (confirmLogin) {
        // Save current URL to localStorage
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      }
      return;
    }

    if (isFavorite) {
      // Use the async action first to prioritize server update
      console.log('Removing movie from favorites (ID:', movie.id, ')');

      // Show immediate feedback in UI
      dispatch(removeFromFavorites(Number(movie.id)));

      // Then update the server
      dispatch(removeFromFavoritesAsync(Number(movie.id)))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie removed from favorites (server updated):', movie.title, result);
        })
        .catch(error => {
          console.error('Error removing from favorites on server:', error);
          // The UI is already updated, so no need to do anything else
        });
    } else {
      // Use the async action first to prioritize server update
      console.log('Adding movie to favorites:', movie.title);

      // Show immediate feedback in UI
      dispatch(addToFavorites(movie));

      // Then update the server - THIS IS THE IMPORTANT PART
      dispatch(addToFavoritesAsync(movie))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie added to favorites (server updated):', movie.title, result);
        })
        .catch(error => {
          console.error('Error adding to favorites on server:', error);
          // The UI is already updated, so no need to do anything else
        });
    }
  };

  return (
    <div className="movie-card-vertical">
      <div className="movie-card-front">
        <div className="movie-poster">
          <img src={imageUrl} alt={movie.title} />
          <div className={`movie-rating ${rating >= 70 ? 'high' : rating >= 50 ? 'medium' : 'low'}`}>
            {rating}%
          </div>
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg viewBox="0 0 24 24" className="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-year">{releaseYear}</p>
          <div className="movie-actions">
            <button className="view-btn" onClick={handleViewClick}>
              View Details
            </button>
          </div>
        </div>
      </div>
      {isHovered && (
        <div
          className="movie-card-back"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="back-content">
            <h4>{movie.title}</h4>
            <div className="movie-details">
              <p className="release-date">
                <span>Release:</span> {movie.release_date}
              </p>
              <p className="rating">
                <span>Rating:</span> {rating}%
              </p>
              {movie.original_language && (
                <p className="language">
                  <span>Language:</span> {movie.original_language.toUpperCase()}
                </p>
              )}
            </div>
            <div className="overview-section">
              <h5>Overview</h5>
              <p className="overview">{movie.overview}</p>
            </div>
            <div className="action-buttons">
              <button className="view-btn" onClick={handleViewClick}>
                View Details
              </button>
              <button
                className={`favorite-btn-large ${isFavorite ? 'active' : ''}`}
                onClick={handleFavoriteClick}
              >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
