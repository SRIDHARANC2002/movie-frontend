import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  addToFavorites,
  removeFromFavorites,
  addToFavoritesAsync,
  removeFromFavoritesAsync,
  fetchFavorites
} from "../../store/Slices/favorites";
import {
  addToWatchList,
  removeFromWatchList,
  addToWatchListAsync,
  removeFromWatchListAsync,
  fetchWatchList
} from "../../store/Slices/watchlist";
import { spotifyService } from "../../services/spotifyService";
import { PLACEHOLDER_POSTER, PLACEHOLDER_PROFILE, PLACEHOLDER_BACKDROP } from "../../utils/placeholderImage";
import "../Styles/MovieDetails.css";
import { useNavigate } from "react-router-dom";

const API_KEY = "1f54bd990f1cdfb230adb312546d765d";
const BASE_URL = "https://api.themoviedb.org/3";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [soundtrack, setSoundtrack] = useState(null);
  const [soundtrackLoading, setSoundtrackLoading] = useState(false);
  const [soundtrackError, setSoundtrackError] = useState(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Safely access favorites with fallback to empty array
  const favorites = useSelector((state) => {
    return state.favorites?.movies || [];
  });

  // Safely access watch list with fallback to empty array
  const watchList = useSelector((state) => {
    return state.watchList?.movies || [];
  });

  // Convert IDs to numbers for consistent comparison
  const isFavorite = favorites.some((m) => Number(m?.id) === Number(id));
  const isInWatchList = watchList.some((m) => Number(m?.id) === Number(id));

  // Check authentication and fetch favorites and watch list on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
      dispatch(fetchWatchList());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);

        // Fetch movie details
        const movieResponse = await axios.get(
          `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`
        );
        setMovie(movieResponse.data);

        // Fetch cast
        const creditsResponse = await axios.get(
          `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`
        );
        setCast(creditsResponse.data.cast.slice(0, 6));

        // Fetch trailer
        const videosResponse = await axios.get(
          `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`
        );
        const trailer = videosResponse.data.results.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }

        setError(null);
      } catch (err) {
        setError("Failed to fetch movie details");
        console.error("Error fetching movie details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  // Set up event listener for messages from Spotify iframe and clean up
  useEffect(() => {
    // Function to handle messages from Spotify iframe
    const handleSpotifyMessage = (event) => {
      try {
        // Only process messages from Spotify
        if (event.origin.includes('spotify.com')) {
          const data = JSON.parse(event.data);

          // Handle player state changes
          if (data.type === 'player_state_changed') {
            // Update our state based on Spotify's state
            if (data.payload && data.payload.paused !== undefined) {
              setIsPlaying(!data.payload.paused);
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    // Add event listener
    window.addEventListener('message', handleSpotifyMessage);

    // Clean up function
    return () => {
      // Remove event listener
      window.removeEventListener('message', handleSpotifyMessage);

      // Reset playback state
      setActiveTrackIndex(null);
      setIsPlaying(false);
    };
  }, []);

  // Fetch soundtrack data when movie data is available
  useEffect(() => {
    const fetchSoundtrack = async () => {
      if (!movie) return;

      try {
        setSoundtrackLoading(true);
        setSoundtrackError(null);

        console.log(`Fetching soundtrack for movie: ${movie.title}`);

        // Try to get tracks specific to this movie
        const tracks = await spotifyService.getTracksFromSearch(movie.title);

        if (tracks && tracks.length > 0) {
          console.log(`✅ Found ${tracks.length} tracks for "${movie.title}"`);
          setSoundtrack(tracks);
        } else {
          throw new Error("No tracks found for this movie");
        }

      } catch (err) {
        console.error("Error fetching soundtrack:", err);
        setSoundtrackError("Failed to load soundtrack");

        try {
          // Try with just the first word of the movie title
          const firstWord = movie.title.split(' ')[0];
          console.log(`Trying with just first word: "${firstWord}"`);

          const firstWordTracks = await spotifyService.getTracksFromSearch(`${firstWord} Tamil`);

          if (firstWordTracks && firstWordTracks.length > 0) {
            console.log(`✅ Found ${firstWordTracks.length} tracks using first word "${firstWord}"`);
            setSoundtrack(firstWordTracks);
            setSoundtrackError(null); // Clear error if this works
          } else {
            throw new Error("No tracks found with first word");
          }
        } catch (firstWordError) {
          console.error("First word search failed:", firstWordError);

          try {
            // Last resort: generic Tamil songs
            console.log("Trying generic Tamil songs search as last resort");
            const fallbackTracks = await spotifyService.getTracksFromSearch("Popular Tamil songs");

            if (fallbackTracks && fallbackTracks.length > 0) {
              console.log(`✅ Using ${fallbackTracks.length} generic Tamil songs as fallback`);
              setSoundtrack(fallbackTracks);
              setSoundtrackError(null); // Clear error if this works
            } else {
              throw new Error("No tracks found in fallback");
            }
          } catch (finalError) {
            console.error("Error fetching fallback playlist:", finalError);
            setSoundtrackError("Failed to load soundtrack");
          }
        }
      } finally {
        setSoundtrackLoading(false);
      }
    };

    fetchSoundtrack();
  }, [movie]);

  // Reference to store the current Spotify iframe
  const spotifyIframeRef = useRef(null);

  // Function to handle direct playback
  const handlePlayTrack = (index, trackId) => {
    try {
      // If this track is already active, toggle it off
      if (activeTrackIndex === index) {
        setActiveTrackIndex(null);
        setIsPlaying(false);

        // Try to pause the Spotify player by sending a postMessage
        try {
          const iframe = document.querySelector('.spotify-player-wrapper iframe');
          if (iframe) {
            // Store the iframe reference
            spotifyIframeRef.current = iframe;

            // Send pause command to Spotify iframe
            iframe.contentWindow.postMessage(JSON.stringify({
              command: 'pause',
              options: {
                robustness: 'SW_SECURE_CRYPTO'
              }
            }), '*');
          }
        } catch (e) {
          console.log('Could not control Spotify iframe:', e);
        }
      } else {
        // If another track is active, close it first
        if (activeTrackIndex !== null) {
          // Try to pause the current player
          try {
            const iframe = document.querySelector('.spotify-player-wrapper iframe');
            if (iframe) {
              iframe.contentWindow.postMessage(JSON.stringify({
                command: 'pause',
                options: {
                  robustness: 'SW_SECURE_CRYPTO'
                }
              }), '*');
            }
          } catch (e) {
            console.log('Could not pause current Spotify iframe:', e);
          }

          setActiveTrackIndex(null);
          setIsPlaying(false);

          // Small delay to ensure the previous player is closed
          setTimeout(() => {
            setActiveTrackIndex(index);
            setIsPlaying(true);

            // Small delay to let the new iframe load
            setTimeout(() => {
              // Try to play the new Spotify player
              try {
                const newIframe = document.querySelector('.spotify-player-wrapper iframe');
                if (newIframe) {
                  // Store the iframe reference
                  spotifyIframeRef.current = newIframe;

                  // Send play command to Spotify iframe
                  newIframe.contentWindow.postMessage(JSON.stringify({
                    command: 'play',
                    options: {
                      robustness: 'SW_SECURE_CRYPTO'
                    }
                  }), '*');
                }
              } catch (e) {
                console.log('Could not control new Spotify iframe:', e);
              }
            }, 500);
          }, 100);
        } else {
          // No track is currently active, so just activate this one immediately
          setActiveTrackIndex(index);
          setIsPlaying(true);

          // Small delay to let the iframe load
          setTimeout(() => {
            // Try to play the Spotify player
            try {
              const iframe = document.querySelector('.spotify-player-wrapper iframe');
              if (iframe) {
                // Store the iframe reference
                spotifyIframeRef.current = iframe;

                // Send play command to Spotify iframe
                iframe.contentWindow.postMessage(JSON.stringify({
                  command: 'play',
                  options: {
                    robustness: 'SW_SECURE_CRYPTO'
                  }
                }), '*');
              }
            } catch (e) {
              console.log('Could not control Spotify iframe:', e);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error handling play track:", error);
    }
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      const confirmLogin = window.confirm('Please log in to add movies to favorites. Would you like to log in?');
      if (confirmLogin) {
        // Save current movie page URL to localStorage
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      }
      return;
    }

    if (isFavorite) {
      // Skip the sync action and use only the async action
      // This ensures we're always updating the server
      console.log('Removing movie from favorites (ID:', id, ')');

      dispatch(removeFromFavoritesAsync(Number(id)))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie removed from favorites (server updated)', result);

          // Force UI update with sync action after server update
          dispatch(removeFromFavorites(Number(id)));
        })
        .catch(error => {
          console.error('Error removing from favorites on server:', error);

          // Still update UI even if server update fails
          dispatch(removeFromFavorites(Number(id)));
        });
    } else {
      // Skip the sync action and use only the async action
      // This ensures we're always updating the server
      console.log('Adding movie to favorites:', movie.title);

      dispatch(addToFavoritesAsync(movie))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie added to favorites (server updated)', result);

          // Force UI update with sync action after server update
          dispatch(addToFavorites(movie));
        })
        .catch(error => {
          console.error('Error adding to favorites on server:', error);

          // Still update UI even if server update fails
          dispatch(addToFavorites(movie));
        });
    }
  };

  const handleWatchListClick = () => {
    if (!isAuthenticated) {
      const confirmLogin = window.confirm('Please log in to add movies to your watch list. Would you like to log in?');
      if (confirmLogin) {
        // Save current movie page URL to localStorage
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      }
      return;
    }

    if (isInWatchList) {
      // Skip the sync action and use only the async action
      // This ensures we're always updating the server
      console.log('Removing movie from watch list (ID:', id, ')');

      dispatch(removeFromWatchListAsync(Number(id)))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie removed from watch list (server updated)', result);

          // Force UI update with sync action after server update
          dispatch(removeFromWatchList(Number(id)));
        })
        .catch(error => {
          console.error('Error removing from watch list on server:', error);

          // Still update UI even if server update fails
          dispatch(removeFromWatchList(Number(id)));
        });
    } else {
      // Skip the sync action and use only the async action
      // This ensures we're always updating the server
      console.log('Adding movie to watch list:', movie.title);

      dispatch(addToWatchListAsync(movie))
        .unwrap()
        .then((result) => {
          console.log('✅ Movie added to watch list (server updated)', result);

          // Force UI update with sync action after server update
          dispatch(addToWatchList(movie));
        })
        .catch(error => {
          console.error('Error adding to watch list on server:', error);

          // Still update UI even if server update fails
          dispatch(addToWatchList(movie));
        });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!movie) {
    return <div className="error-container">Movie not found</div>;
  }

  return (
    <div className="movie-details-container">
      <div className="hero-section">
        <div className="hero-background">
          {trailerKey ? (
            <div className="trailer-container">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&showinfo=0`}
                title="Movie Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <button
                className="mute-toggle"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <div
              className="backdrop-image"
              style={{
                backgroundImage: movie.backdrop_path
                  ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
                  : `url(${PLACEHOLDER_BACKDROP})`
              }}
            />
          )}
          <div className="hero-overlay">
            <div className="hero-content">
              <div className="movie-poster">
                <img
                  src={movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : PLACEHOLDER_POSTER
                  }
                  alt={movie.title}
                />
              </div>
              <div className="movie-info">
                <h1>{movie.title}</h1>
                <div className="movie-meta">
                  <span className="release-date">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="runtime">{movie.runtime} min</span>
                  <span className="rating">★ {movie.vote_average.toFixed(1)}</span>
                </div>
                <div className="genres">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
                <p className="tagline">{movie.tagline}</p>
                <div className="overview">
                  <h3>Overview</h3>
                  <p>{movie.overview}</p>
                </div>
                <div className="action-buttons">
                  <button
                    className={`favorite-button ${isFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteClick}
                  >
                    <svg viewBox="0 0 24 24" className="heart-icon">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                  <button
                    className={`watchlist-button ${isInWatchList ? 'active' : ''}`}
                    onClick={handleWatchListClick}
                  >
                    <svg viewBox="0 0 24 24" className="watchlist-icon">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {isInWatchList ? 'Remove from Watch List' : 'Add to Watch List'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-section">
        <div className="container">
          <div className="movie-stats">
            <div className="stat-card">
              <h4>Status</h4>
              <p>{movie.status}</p>
            </div>
            <div className="stat-card">
              <h4>Budget</h4>
              <p>₹{(movie.budget * 83.16).toLocaleString('en-IN')}</p>
            </div>
            <div className="stat-card">
              <h4>Revenue</h4>
              <p>₹{(movie.revenue * 83.16).toLocaleString('en-IN')}</p>
            </div>
            <div className="stat-card">
              <h4>Original Language</h4>
              <p>{movie.original_language.toUpperCase()}</p>
            </div>
          </div>

          <div className="cast-section">
            <h2>Featured Cast</h2>
            <div className="cast-grid">
              {cast.map(person => (
                <div key={person.id} className="cast-card">
                  <div className="cast-image">
                    <img
                      src={person.profile_path
                        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                        : PLACEHOLDER_PROFILE
                      }
                      alt={person.name}
                    />
                  </div>
                  <div className="cast-info">
                    <h4>{person.name}</h4>
                    <p>{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="production-section">
            <h2>Production Companies</h2>
            <div className="companies-list">
              {movie.production_companies.map(company => (
                <div key={company.id} className="company-item">
                  {company.logo_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                      alt={company.name}
                    />
                  ) : (
                    <span className="company-name">{company.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Soundtrack Section */}
          <div className="soundtrack-section">
            <h2>Movie Soundtrack</h2>
            {soundtrackLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : soundtrackError ? (
              <div className="error-message">
                <p>{soundtrackError}</p>
              </div>
            ) : soundtrack && soundtrack.length > 0 ? (
              <>
                <div className="soundtrack-source">
                  <p>
                    {`Songs related to ${movie.title}`}
                  </p>
                  <div className="soundtrack-info">
                    <span className="info-item">
                      <svg viewBox="0 0 24 24" className="icon-download">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-4h3l-4-4-4 4h3z"/>
                      </svg>
                      Click blue button to open in Spotify
                    </span>
                    <span className="info-item">
                      <svg viewBox="0 0 24 24" className="icon-spotify">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-5.5l6-3.5-6-3.5v7z"/>
                      </svg>
                      Click green button to play in-app
                    </span>
                  </div>
                </div>
                <div className="soundtrack-list">
                  {soundtrack.map((item, index) => (
                    <div key={index} className="track-container">
                      <div className="track-item">
                        <div className="track-image">
                          {item.track.album.images && item.track.album.images.length > 0 ? (
                            <img
                              src={item.track.album.images[0].url}
                              alt={item.track.name}
                            />
                          ) : (
                            <div className="no-image">🎵</div>
                          )}
                        </div>
                        <div className="track-info">
                          <h4>{item.track.name}</h4>
                          <p>{item.track.artists.map(artist => artist.name).join(', ')}</p>
                        </div>
                        <div className="track-actions">
                          <button
                            className={`play-track-button ${activeTrackIndex === index ? 'active' : ''}`}
                            onClick={() => {
                              // Show immediate visual feedback
                              const button = document.activeElement;
                              if (button) {
                                button.classList.add('clicked');
                                setTimeout(() => button.classList.remove('clicked'), 200);
                              }

                              // Handle the actual playback
                              handlePlayTrack(index, item.track.id);
                            }}
                            title={activeTrackIndex === index ? "Pause song" : "Play song"}
                          >
                            <svg viewBox="0 0 24 24">
                              {activeTrackIndex === index ? (
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                              ) : (
                                <path d="M8 5v14l11-7z"/>
                              )}
                            </svg>
                            <span className="sr-only">{activeTrackIndex === index ? "Pause" : "Play"}</span>
                          </button>
                          <a
                            href={item.track.external_urls?.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-track-button"
                            title="Open in Spotify"
                          >
                            <svg viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-4h3l-4-4-4 4h3z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="track-player" style={{ display: activeTrackIndex === index ? 'block' : 'none' }}>
                        {activeTrackIndex === index && (
                          <div className="spotify-player-wrapper">
                            <iframe
                              key={`player-${item.track.id}-${Date.now()}`} // Force re-render every time with unique timestamp
                              src={`https://open.spotify.com/embed/track/${item.track.id}?utm_source=generator&theme=0&autoplay=1`}
                              width="100%"
                              height="80"
                              frameBorder="0"
                              allowtransparency="true"
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="eager" // Changed from lazy to eager for faster loading
                              title={`Play ${item.track.name}`}
                              id={`spotify-iframe-${index}`}
                              className="spotify-iframe"
                              onLoad={() => {
                                // When iframe loads, try to get a reference to it
                                const iframe = document.getElementById(`spotify-iframe-${index}`);
                                if (iframe) {
                                  spotifyIframeRef.current = iframe;

                                  // If we're supposed to be playing, send play command with robustness level
                                  if (isPlaying) {
                                    try {
                                      setTimeout(() => {
                                        iframe.contentWindow.postMessage(JSON.stringify({
                                          command: 'play',
                                          options: {
                                            robustness: 'SW_SECURE_CRYPTO' // Add robustness level
                                          }
                                        }), '*');
                                      }, 300);
                                    } catch (e) {
                                      console.log('Could not send play command to iframe:', e);
                                    }
                                  }
                                }
                              }}
                            ></iframe>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="soundtrack-footer">
                  <p>Powered by Spotify</p>
                </div>
              </>
            ) : (
              <div className="no-soundtrack">
                <p>No soundtrack available for this movie.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
