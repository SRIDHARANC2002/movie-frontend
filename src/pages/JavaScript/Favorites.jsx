import React from "react";
import { useSelector } from "react-redux";
import MovieCardVertical from "../../components/Movies/JavaScript/MovieCardVertical";
import "../Styles/Favorites.css";

export default function Favorites() {
  // Safely access favorites with fallback to empty array
  const favorites = useSelector((state) => {
    return state.favorites?.movies || [];
  });

  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <div className="empty-content">
          <svg className="heart-icon" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <h2>No Favorite Movies Yet</h2>
          <p>Start adding movies to your favorites by clicking the heart icon on any movie card!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <h1>My Favorite Movies</h1>
      <div className="favorites-grid">
        {favorites.map((movie) => (
          <MovieCardVertical key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
