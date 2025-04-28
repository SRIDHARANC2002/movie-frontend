import axios from 'axios';

const API_KEY = "1f54bd990f1cdfb230adb312546d765d";
const BASE_URL = "https://api.themoviedb.org/3";

// TMDB Genre IDs for different categories
export const GENRE_IDS = {
    ACTION: 28,
    ADVENTURE: 12,
    COMEDY: 35,
    CRIME: 80,
    DOCUMENTARY: 99,
    DRAMA: 18,
    FAMILY: 10751,
    FANTASY: 14,
    HISTORY: 36,
    HORROR: 27,
    MUSIC: 10402,
    MYSTERY: 9648,
    ROMANCE: 10749,
    SCIENCE_FICTION: 878,
    THRILLER: 53,
    WAR: 10752
};

// Function to fetch genre list from TMDB
export const fetchGenres = async () => {
    try {
        const response = await axios.get(
            `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
        );
        return response.data.genres;
    } catch (error) {
        console.error("Error fetching genres:", error);
        return [];
    }
};

// Function to fetch movies by genre
export const fetchMoviesByGenre = async (genreId, page = 1, language = 'ta') => {
    try {
        const params = {
            api_key: API_KEY,
            with_genres: genreId,
            page: page,
            with_original_language: language,
            sort_by: 'popularity.desc'
        };

        const response = await axios.get(`${BASE_URL}/discover/movie`, { params });
        return {
            movies: response.data.results,
            totalPages: response.data.total_pages,
            totalResults: response.data.total_results
        };
    } catch (error) {
        console.error("Error fetching movies by genre:", error);
        return { movies: [], totalPages: 0, totalResults: 0 };
    }
};

// Function to get recommended movies based on genre combinations
export const getRecommendedMovies = async (genres, page = 1, language = 'ta') => {
    try {
        const genreIds = genres.join('|');
        const params = {
            api_key: API_KEY,
            with_genres: genreIds,
            page: page,
            with_original_language: language,
            sort_by: 'popularity.desc',
            'vote_count.gte': 100 // Using string key for the parameter
        };

        const response = await axios.get(`${BASE_URL}/discover/movie`, { params });
        return {
            movies: response.data.results,
            totalPages: response.data.total_pages,
            totalResults: response.data.total_results
        };
    } catch (error) {
        console.error("Error fetching recommended movies:", error);
        return { movies: [], totalPages: 0, totalResults: 0 };
    }
};

// Function to analyze a movie's genres and get similar movies
export const getSimilarMovies = async (movieId) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`
        );
        return response.data.results;
    } catch (error) {
        console.error("Error fetching similar movies:", error);
        return [];
    }
};
