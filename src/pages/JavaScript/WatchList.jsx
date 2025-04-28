import React from "react";
import { useSelector } from "react-redux";
import MovieCardHorizontal from "../../components/Movies/JavaScript/MovieCardHorizontal";

export default function WatchList() {
  // Safely access watchlist with fallback to empty array
  const watchList = useSelector((state) => {
    return state.watchList?.watchListValues || [];
  });

  return (
    <div className="container mt-4">
      <h2 className="mb-4">My Watchlist</h2>

      {watchList.length === 0 ? (
        <div className="alert alert-info">
          Your watchlist is empty. Add some movies to watch later!
        </div>
      ) : (
        <div>
          {watchList.map((movie) => (
            <MovieCardHorizontal key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
