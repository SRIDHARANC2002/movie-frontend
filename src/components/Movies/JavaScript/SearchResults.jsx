import React from 'react';
import { NavLink } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL, POSTER_SIZES } from "../../../config/tmdb";
import defaultMoviePoster from "../../../assets/images/default-movie-poster.png";
import "./../Styles/SearchResults.css";

export default function SearchResults({ results, onClose }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="search-results-container">
      <div className="search-results">
        {results.map((movie) => (
          <NavLink 
            key={movie.id} 
            to={`/details/${movie.id}`}
            className="search-result-item"
            onClick={onClose}
          >
            <img
              src={movie.poster_path 
                ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZES.small}${movie.poster_path}`
                : defaultMoviePoster}
              alt={movie.title}
              className="search-result-poster"
              onError={(e) => {
                e.target.src = defaultMoviePoster;
              }}
            />
            <div className="search-result-info">
              <h5>{movie.title}</h5>
              <p className="release-date">
                {movie.release_date && new Date(movie.release_date).getFullYear()}
              </p>
              <p className="overview">{movie.overview}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
