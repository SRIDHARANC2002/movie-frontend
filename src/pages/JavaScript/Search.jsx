import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom"; 
import axios from "axios";
import MovieCardVertical from "../../components/Movies/JavaScript/MovieCardVertical";
import Pagination from "../../components/Layout/JavaScript/Pagination";
import "./../Styles/Search.css";

const API_KEY = "1f54bd990f1cdfb230adb312546d765d";
const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const POSTER_SIZES = {
  small: "w92",
  medium: "w185",
  large: "w500"
};

// Movies to exclude (by title)
const EXCLUDED_MOVIES = ["Anaagarigam"];

// Predefined suggestions and popular movie keywords
const POPULAR_SUGGESTIONS = [
  { type: 'keyword', name: "Rajinikanth" },
  { type: 'keyword', name: "Kollywood" },
  { type: 'keyword', name: "Action" },
  { type: 'keyword', name: "Comedy" },
  { type: 'keyword', name: "Vijay" }
];

export default function Search() {
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localQuery, setLocalQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const query = searchParams.get("q");
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchSuggestions = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setSuggestions(POPULAR_SUGGESTIONS);
      return;
    }

    try {
      // Fetch movie suggestions with posters
      const movieResponse = await axios.get(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchTerm}&language=en-US&page=1&include_adult=false`
      );

      // Fetch actor suggestions
      const personResponse = await axios.get(
        `${BASE_URL}/search/person?api_key=${API_KEY}&query=${searchTerm}&language=en-US&page=1&include_adult=false`
      );

      // Combine and deduplicate suggestions
      const movieSuggestions = movieResponse.data.results
        .slice(0, 5)
        .map(movie => ({
          type: 'movie',
          id: movie.id,
          name: movie.title,
          poster: movie.poster_path 
            ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZES.small}${movie.poster_path}`
            : null
        }));
      
      const actorSuggestions = personResponse.data.results
        .slice(0, 5)
        .map(person => ({
          type: 'actor',
          id: person.id,
          name: person.name,
          poster: person.profile_path
            ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZES.small}${person.profile_path}`
            : null
        }));
      
      const filteredSuggestions = [
        ...movieSuggestions,
        ...actorSuggestions,
        ...POPULAR_SUGGESTIONS.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ].slice(0, 10);

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions(POPULAR_SUGGESTIONS);
    }
  };

  const searchMovies = useCallback(async (searchTerm, page = 1) => {
    if (!searchTerm) {
      setMovies([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Prioritize Tamil movies, but fall back to general search
      const responses = await Promise.all([
        axios.get(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchTerm}&page=${page}&with_original_language=ta&region=IN`
        ),
        axios.get(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchTerm}&page=${page}`
        )
      ]);
      
      // Combine and deduplicate results
      const tamilMovies = responses[0].data.results.filter(
        movie => !EXCLUDED_MOVIES.includes(movie.title)
      );
      
      const otherMovies = responses[1].data.results.filter(
        movie => 
          !EXCLUDED_MOVIES.includes(movie.title) &&
          !tamilMovies.some(tm => tm.id === movie.id)
      );
      
      const combinedMovies = [...tamilMovies, ...otherMovies].slice(0, 20);
      
      setMovies(combinedMovies);
      setTotalPages(Math.min(responses[0].data.total_pages, 10));
      setError(null);
    } catch (err) {
      setError("Failed to search movies. Please try different keywords.");
      console.error("Error searching movies:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      // Update URL and trigger search
      if (value.trim()) {
        setSearchParams({ q: value.trim() });
      } else {
        setSearchParams({});
      }
      
      // Fetch suggestions
      fetchSuggestions(value);
    }, 300); // 300ms debounce
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalQuery(suggestion.name);
    setSearchParams({ q: suggestion.name });
    setShowSuggestions(false);
  };

  // Search when query changes in URL
  useEffect(() => {
    if (query) {
      searchMovies(query, currentPage);
    }
  }, [query, currentPage, searchMovies]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initial suggestions on component mount
  useEffect(() => {
    setSuggestions(POPULAR_SUGGESTIONS);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mt-4 search-container">
      <form onSubmit={handleSearch} className="mb-4 search-form">
        <div className="input-group search-input-group" ref={searchInputRef}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search Movies, Actors, or Genres" 
            value={localQuery}
            onChange={handleQueryChange}
            onFocus={() => fetchSuggestions(localQuery)}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
          >
            <i className="fas fa-search me-2"></i>Search
          </button>
          
          {showSuggestions && suggestions.length > 0 && (
            <div 
              className="suggestions-dropdown" 
              ref={suggestionsRef}
            >
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.poster && (
                    <img 
                      src={suggestion.poster} 
                      alt={suggestion.name} 
                      className="suggestion-poster"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="suggestion-text">{suggestion.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {!query ? (
        <div className="text-center my-5">
          <h2>Search Movies</h2>
          <p className="text-muted">
            Enter a movie title, actor, or genre in the search bar above
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-4">
            Search Results for "{query}"
          </h2>

          {isLoading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : movies.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No movies found matching your search. Try different keywords.
            </div>
          ) : (
            <>
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                {movies.map((movie) => (
                  <div className="col" key={movie.id}>
                    <MovieCardVertical movie={movie} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.min(totalPages, 10)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
