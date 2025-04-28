import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addMovie } from "../../store/Slices/watchlist";

const API_KEY = "1f54bd990f1cdfb230adb312546d765d";
const BASE_URL = "https://api.themoviedb.org/3";

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const watchList = useSelector((state) => state.watchlist?.watchListValues);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch movie details
        const movieResponse = await axios.get(
          `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`
        );
        
        if (!isMounted) return;
        
        // Check if movie exists
        if (!movieResponse.data) {
          throw new Error("Movie not found");
        }
        
        setMovie(movieResponse.data);

        // Fetch cast information
        const creditsResponse = await axios.get(
          `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`
        );
        
        if (!isMounted) return;
        setCast(creditsResponse.data.cast.slice(0, 10));

        // Fetch similar Tamil movies
        const similarResponse = await axios.get(
          `${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}&language=ta&with_original_language=ta&region=IN&page=1`
        );
        
        if (!isMounted) return;
        setSimilarMovies(similarResponse.data.results.slice(0, 6));

      } catch (err) {
        if (!isMounted) return;
        
        console.error("Error fetching movie details:", err);
        if (err.response?.status === 404) {
          setError("Movie not found. Please check the movie ID.");
          navigate("/"); // Redirect to home page after 3 seconds
          setTimeout(() => {
            if (isMounted) {
              navigate("/");
            }
          }, 3000);
        } else {
          setError("Failed to load movie details. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovieDetails();
    
    // Cleanup function to prevent memory leaks and state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleAddToWatchlist = () => {
    if (!isAuthenticated) {
      alert("Please login to add movies to your watchlist");
      return;
    }
    
    const isMovieInWatchList = watchList?.some((item) => item.id === movie.id);
    if (isMovieInWatchList) {
      alert("Movie is already in your watchlist");
      return;
    }
    
    dispatch(addMovie(movie));
    alert("Movie added to watchlist!");
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Redirecting to home page in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info" role="alert">
          No movie details available.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Movie Poster */}
        <div className="col-md-4">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="img-fluid rounded shadow"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=No+Image+Available';
            }}
          />
          {isAuthenticated && (
            <button
              className="btn btn-success w-100 mt-3"
              onClick={handleAddToWatchlist}
            >
              Add to Watchlist
            </button>
          )}
        </div>

        {/* Movie Details */}
        <div className="col-md-8">
          <h1 className="mb-3">{movie.title}</h1>
          <div className="d-flex align-items-center mb-3">
            <span className="badge bg-primary me-2">{movie.vote_average.toFixed(1)}/10</span>
            <span className="text-muted">({movie.vote_count} votes)</span>
            <span className="mx-3">|</span>
            <span>{movie.release_date}</span>
            <span className="mx-3">|</span>
            <span>{movie.runtime} min</span>
          </div>

          {movie.tagline && (
            <p className="lead fst-italic text-muted mb-3">"{movie.tagline}"</p>
          )}

          <h5 className="mt-4">Overview</h5>
          <p>{movie.overview}</p>

          <div className="row mt-4">
            <div className="col-md-6">
              <h5>Genres</h5>
              <div className="mb-3">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="badge bg-secondary me-2">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <h5>Production Companies</h5>
              <p>{movie.production_companies.map(company => company.name).join(', ')}</p>
            </div>
          </div>

          {/* Cast Section */}
          {cast.length > 0 && (
            <>
              <h5 className="mt-4">Top Cast</h5>
              <div className="row row-cols-2 row-cols-md-5 g-3 mb-4">
                {cast.map((actor) => (
                  <div key={actor.id} className="col">
                    <div className="card h-100 border-0">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                        className="card-img-top rounded"
                        alt={actor.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                        }}
                      />
                      <div className="card-body p-2">
                        <h6 className="card-title mb-0">{actor.name}</h6>
                        <small className="text-muted">{actor.character}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Similar Movies Section */}
          {similarMovies.length > 0 && (
            <>
              <h5 className="mt-4">Similar Movies</h5>
              <div className="row row-cols-2 row-cols-md-6 g-3">
                {similarMovies.map((movie) => (
                  <div key={movie.id} className="col">
                    <div className="card h-100 border-0" onClick={() => navigate(`/details/${movie.id}`)}>
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        className="card-img-top rounded"
                        alt={movie.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                        }}
                      />
                      <div className="card-body p-2">
                        <h6 className="card-title mb-0">{movie.title}</h6>
                        <small className="text-muted">
                          {movie.release_date?.split('-')[0]}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
