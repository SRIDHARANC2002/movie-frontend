import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWatchList } from '../../store/Slices/watchlist';
import MovieCardVertical from "../../components/Movies/JavaScript/MovieCardVertical";
import "../Styles/Favorites.css";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function WatchList() {
  const dispatch = useDispatch();
  // Safely access watch list with fallback to empty array
  const watchList = useSelector((state) => {
    return state.watchList?.movies || [];
  });

  useEffect(() => {
    dispatch(fetchWatchList());
  }, [dispatch]);

  if (watchList.length === 0) {
    return (
      <div className="favorites-empty">
        <div className="empty-content">
          <FontAwesomeIcon icon={faEye} className="watch-icon" size="3x" />
          <h2>No Movies in Watch List Yet</h2>
          <p>Start adding movies to your watch list by clicking the eye icon on any movie card!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container watch-list-container">
      <h1>My Watch List</h1>
      <div className="favorites-grid">
        {watchList.map((movie) => (
          <MovieCardVertical
            key={movie.id}
            movie={movie}
            isInWatchList={true}
          />
        ))}
      </div>
    </div>
  );
}
