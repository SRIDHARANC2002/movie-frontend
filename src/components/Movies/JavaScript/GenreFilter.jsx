import React from "react";
import "./../Styles/GenreFilter.css";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 10749, name: "Romance" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 53, name: "Thriller" },
  { id: 27, name: "Horror" },
  { id: 36, name: "Historical" },
  { id: 14, name: "Fantasy" },
  { id: 878, name: "Science Fiction" },
  { id: 99, name: "Documentary" },
  { id: 10402, name: "Musical" },
  { id: 12, name: "Adventure" },
  { id: 10751, name: "Family" },
  { id: 80, name: "Crime" },
  { id: 9648, name: "Mystery" }
];

export default function GenreFilter({ selectedGenre, onGenreSelect }) {
  return (
    <div className="genre-filter">
      <h3 className="genre-title">Movie Genres</h3>
      <div className="genre-buttons">
        <button
          className={`genre-button ${selectedGenre === null ? 'active' : ''}`}
          onClick={() => onGenreSelect(null)}
        >
          All Movies
        </button>
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            className={`genre-button ${selectedGenre === genre.id ? 'active' : ''}`}
            onClick={() => onGenreSelect(genre.id)}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export { GENRES };
