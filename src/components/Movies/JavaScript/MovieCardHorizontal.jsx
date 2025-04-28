import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { addMovie, removeMovie } from "../../../store/Slices/watchlist";
import { NavLink } from "react-router-dom";
import "./../Styles/MovieCardHorizontal.css";
import { TMDB_IMAGE_BASE_URL, POSTER_SIZES } from "../../../config/tmdb";
import defaultMoviePoster from "../../../assets/images/default-movie-poster.png";

export default function MovieCardHorizontal(props) {
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const watchList = useSelector((state) => state.watchList.watchListValues);
  const dispatch = useDispatch();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    if (watchList.some((movie) => movie.id === props.movie.id)) {
      setLiked(true);
    } else {
      setLiked(false);
    }
  }, [props.movie, watchList]);

  function handleWatchList() {
    if (liked) {
      dispatch(removeMovie(props.movie.id));
    } else {
      dispatch(addMovie(props.movie));
    }
  }

  const scaledVote = props.movie.vote_average
    ? props.movie.vote_average / 2
    : 0;

  return (
    <div className="col-md-8">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <img
            src={props.movie.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZES.small}${props.movie.poster_path}`
              : defaultMoviePoster}
            onError={(e) => {
              if (!imageError) {
                setImageError(true);
                e.target.src = defaultMoviePoster;
              }
            }}
            alt={props.movie.title}
            className="movie-poster me-3"
            style={{ width: "100px", height: "150px", objectFit: "cover" }}
          />
          <div>
            <div className="d-flex">
              <NavLink className="link" to={`../details/${props.movie.id}`}>
                <h4 className="card-title" style={{ fontWeight: "bolder" }}>
                  {props.movie.title}
                </h4>
              </NavLink>
            </div>
            {props.movie.release_date && (
              <p className="card-text">
                <small className="text-body-secondary">
                  {months[new Date(props.movie.release_date).getMonth()]}{" "}
                  {new Date(props.movie.release_date).getDate()},{" "}
                  {new Date(props.movie.release_date).getFullYear()}
                </small>
              </p>
            )}
            <div className="action-buttons">
              <button className="action-button" onClick={() => window.open(`https://www.youtube.com/results?search_query=${props.movie.title}+trailer`, '_blank')}>
                <i className="fas fa-play"></i>
                Watch Trailer
              </button>
              <button className="action-button" onClick={handleWatchList}>
                <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} />
                {liked ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
            <div className="d-flex my-2">
              <div>
                {/* Render full stars (capped at 5) */}
                {scaledVote % 1 !== 0 &&
                  Array(Math.floor(scaledVote))
                    .fill()
                    .map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className="text-warning "
                      />
                    ))}

                {/* Render half star if needed */}
                {scaledVote % 1 !== 0 && (
                  <FontAwesomeIcon
                    key="half"
                    icon={faStarHalfAlt}
                    className="text-warning"
                  />
                )}

                {/* Render empty stars if needed */}
                {Array(Math.floor(5 - scaledVote))
                  .fill()
                  .map((_, i) => (
                    <FontAwesomeIcon
                      key={i}
                      icon={faStar}
                      className="text-warning opacity-25"
                    />
                  ))}
              </div>
              <span className="text-muted me-2 mx-2">
                {Number(props.movie.vote_count?.toFixed(1)) || 0}
              </span>
            </div>
            <p className="card-text">{props.movie.overview}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
