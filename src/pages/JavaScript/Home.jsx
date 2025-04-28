import { useEffect, useState } from "react";
import MovieCardVertical from "../../components/Movies/JavaScript/MovieCardVertical";
import SearchBox from "../../components/Movies/JavaScript/SearchBox";
import GenreFilter from "../../components/Movies/JavaScript/GenreFilter";
import Pagination from "../../components/Layout/JavaScript/Pagination";
import axios from "axios";
import "../Styles/Home.css";

const API_KEY = "1f54bd990f1cdfb230adb312546d765d";
const BASE_URL = "https://api.themoviedb.org/3";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ta&page=${currentPage}&sort_by=popularity.desc&region=IN`;
        
        if (selectedGenre) {
          url += `&with_genres=${selectedGenre}`;
        }

        const response = await axios.get(url);
        setMovies(response.data.results);
        setTotalPages(response.data.total_pages);
        setError(null);
      } catch (err) {
        setError("Failed to fetch movies. Please try again later.");
        console.error("Error fetching movies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage, selectedGenre]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId);
    setCurrentPage(1);
  };

  return (
    <div className="home-container">
      <header className="header-section">
        <div className="header-content">
          <h1 className="main-title">Tamil Movie</h1>
          <p className="subtitle">
            Discover the best of Tamil cinema. Explore now.
          </p>
          <div className="search-wrapper">
            <SearchBox />
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="genre-wrapper">
            <GenreFilter 
              selectedGenre={selectedGenre} 
              onGenreSelect={handleGenreSelect}
            />
          </div>

          <div className="content-header">
            <h2 className="section-title">
              {selectedGenre ? 'Genre Movies' : 'Popular Tamil Movies'}
            </h2>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="error-message">
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            </div>
          ) : (
            <div className="movies-section">
              <div className="movie-grid">
                {movies.map((movie) => (
                  <div key={movie.id} className="movie-item">
                    <MovieCardVertical movie={movie} />
                  </div>
                ))}
              </div>
              
              {movies.length === 0 && (
                <div className="no-results">
                  <h3>No movies found for this genre</h3>
                  <p>Try selecting a different genre or check back later.</p>
                </div>
              )}
              
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.min(totalPages, 500)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
