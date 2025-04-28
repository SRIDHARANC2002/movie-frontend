import axios from 'axios';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = 'd11c3baf6dbf4135b3be860d6f537d5a';
const SPOTIFY_CLIENT_SECRET = '0f408f96d508496d9fef80ed13ef0180';
let accessToken = null;
let tokenExpirationTime = null;

// Simple cache for soundtrack data to improve performance
const soundtrackCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

// Movie soundtrack playlist mapping
// This maps movie titles to their specific Spotify playlists
const MOVIE_SOUNDTRACK_PLAYLISTS = {
    // Recent Tamil Movies (2023-2024)
    "Vidaamuyarchi": "1nbDSTLKDO9SvjQ2cOQglE",    // Vidaamuyarchi soundtrack
    "Amaran": "37i9dQZF1DX1i3hvzHpcQV",           // Amaran soundtrack
    "Vettaiyan": "37i9dQZF1DX0XUfTFmNBEL",        // Vettaiyan soundtrack
    "Kanguva": "37i9dQZF1DX6cg4h2PoN9y",          // Kanguva soundtrack
    "Maharaja": "6Gg7NG4Eo6KFSRkXKLYvHB",         // Maharaja soundtrack
    "Raayan": "37i9dQZF1DWVo4cdnikh7Z",           // Raayan soundtrack (Latest Tamil playlist)
    "Saripodhaa Sanivaaram": "4Rl7P1vFYzGbQEpEFyxFXS", // Saripodhaa Sanivaaram soundtrack
    "Aranmanai 4": "37i9dQZF1DWVo4cdnikh7Z",      // Aranmanai 4 soundtrack (Latest Tamil playlist)
    "Ayalaan": "37i9dQZF1DWVo4cdnikh7Z",          // Ayalaan soundtrack (Latest Tamil playlist)
    "Captain Miller": "37i9dQZF1DWVo4cdnikh7Z",    // Captain Miller soundtrack (Latest Tamil playlist)
    "Lal Salaam": "37i9dQZF1DWVo4cdnikh7Z",        // Lal Salaam soundtrack (Latest Tamil playlist)
    "Thangalaan": "37i9dQZF1DWVo4cdnikh7Z",        // Thangalaan soundtrack (Latest Tamil playlist)
    "Siren": "37i9dQZF1DWVo4cdnikh7Z",            // Siren soundtrack (Latest Tamil playlist)
    "Maamannan": "37i9dQZF1DWVo4cdnikh7Z",         // Maamannan soundtrack (Latest Tamil playlist)
    "Ponniyin Selvan: II": "37i9dQZF1DWVo4cdnikh7Z", // Ponniyin Selvan: II soundtrack (Latest Tamil playlist)
    "Leo": "11YJfivZjEaEUU9lJmeidh",              // Leo soundtrack
    "Jailer": "0zRUzTXH7GtGLxt6uVdARD",           // Jailer soundtrack
    "Mark Antony": "37i9dQZF1DWVo4cdnikh7Z",       // Mark Antony soundtrack (Latest Tamil playlist)
    "Chithha": "37i9dQZF1DWVo4cdnikh7Z",           // Chithha soundtrack (Latest Tamil playlist)
    "Maaveeran": "37i9dQZF1DWVo4cdnikh7Z",         // Maaveeran soundtrack (Latest Tamil playlist)
    "Por Thozhil": "37i9dQZF1DWVo4cdnikh7Z",       // Por Thozhil soundtrack (Latest Tamil playlist)
    "Vaathi": "37i9dQZF1DWVo4cdnikh7Z",            // Vaathi soundtrack (Latest Tamil playlist)
    "Pathu Thala": "37i9dQZF1DWVo4cdnikh7Z",       // Pathu Thala soundtrack (Latest Tamil playlist)
    "Varisu": "37i9dQZF1DWVo4cdnikh7Z",            // Varisu soundtrack (Latest Tamil playlist)
    "Thunivu": "37i9dQZF1DWVo4cdnikh7Z",           // Thunivu soundtrack (Latest Tamil playlist)
    "Vikram": "37i9dQZF1DWVo4cdnikh7Z",            // Vikram soundtrack (Latest Tamil playlist)
    "Thiruchitrambalam": "37i9dQZF1DWVo4cdnikh7Z",  // Thiruchitrambalam soundtrack (Latest Tamil playlist)
    "Naane Varuvean": "37i9dQZF1DWVo4cdnikh7Z",    // Naane Varuvean soundtrack (Latest Tamil playlist)
    "Vendhu Thanindhathu Kaadu": "37i9dQZF1DWVo4cdnikh7Z", // Vendhu Thanindhathu Kaadu soundtrack (Latest Tamil playlist)
    "Ponniyin Selvan: I": "37i9dQZF1DWVo4cdnikh7Z", // Ponniyin Selvan: I soundtrack (Latest Tamil playlist)
    "Viruman": "37i9dQZF1DWVo4cdnikh7Z",           // Viruman soundtrack (Latest Tamil playlist)
    "Kaathuvaakula Rendu Kaadhal": "37i9dQZF1DWVo4cdnikh7Z", // Kaathuvaakula Rendu Kaadhal soundtrack (Latest Tamil playlist)
    "Beast": "37i9dQZF1DWVo4cdnikh7Z",             // Beast soundtrack (Latest Tamil playlist)
    "Etharkkum Thunindhavan": "37i9dQZF1DWVo4cdnikh7Z", // Etharkkum Thunindhavan soundtrack (Latest Tamil playlist)
    "Valimai": "37i9dQZF1DWVo4cdnikh7Z",           // Valimai soundtrack (Latest Tamil playlist)
    "Maanaadu": "37i9dQZF1DWVo4cdnikh7Z",          // Maanaadu soundtrack (Latest Tamil playlist)
    "Annaatthe": "37i9dQZF1DWVo4cdnikh7Z",         // Annaatthe soundtrack (Latest Tamil playlist)
    "Doctor": "37i9dQZF1DWVo4cdnikh7Z",            // Doctor soundtrack (Latest Tamil playlist)
    "Karnan": "37i9dQZF1DWVo4cdnikh7Z",            // Karnan soundtrack (Latest Tamil playlist)
    "Master": "11YJfivZjEaEUU9lJmeidh",            // Master soundtrack

    // Upcoming Tamil Movies
    "Indian 2": "37i9dQZF1DWVo4cdnikh7Z",          // Indian 2 soundtrack (Latest Tamil playlist)
    "Thug Life": "37i9dQZF1DWVo4cdnikh7Z",         // Thug Life soundtrack (Latest Tamil playlist)
    "Coolie": "37i9dQZF1DWVo4cdnikh7Z",            // Coolie soundtrack (Latest Tamil playlist)
    "Thalapathy 69": "37i9dQZF1DWVo4cdnikh7Z",     // Thalapathy 69 soundtrack (Latest Tamil playlist)
    "Rajinikanth 170": "37i9dQZF1DWVo4cdnikh7Z",   // Rajinikanth 170 soundtrack (Latest Tamil playlist)

    // Fallback Tamil playlists
    "_TAMIL_HITS_": "37i9dQZF1DX6cg4h2PoN9y",      // Tamil Hits playlist (fallback)
    "_LATEST_TAMIL_": "37i9dQZF1DWVo4cdnikh7Z"     // Latest Tamil Top 50 (alternative fallback)
};

export const spotifyService = {
    // Get movie-specific soundtrack playlist
    getMovieSpecificPlaylist: (movieTitle) => {
        // Check if we have a specific playlist for this movie
        const playlistId = MOVIE_SOUNDTRACK_PLAYLISTS[movieTitle];

        // If found, return it
        if (playlistId) {
            return playlistId;
        }

        // If not found, return the fallback Tamil hits playlist
        console.log(`No specific playlist found for "${movieTitle}", using Tamil Hits fallback`);
        return MOVIE_SOUNDTRACK_PLAYLISTS["_TAMIL_HITS_"];
    },

    // Get guaranteed working playlist ID (for any movie)
    getGuaranteedPlaylist: () => {
        // These are verified working playlists
        const workingPlaylists = [
            "37i9dQZF1DX6cg4h2PoN9y",  // Tamil Hits
            "37i9dQZF1DWVo4cdnikh7Z",   // Latest Tamil Top 50
            "37i9dQZF1DX1i3hvzHpcQV"    // Another Tamil playlist
        ];

        // Return a random working playlist
        return workingPlaylists[Math.floor(Math.random() * workingPlaylists.length)];
    },

    // Get access token using client credentials flow
    getAccessToken: async () => {
        try {
            // Check if we already have a valid token
            if (accessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
                console.log('🔑 Using existing Spotify access token');
                return accessToken;
            }

            console.log('🔑 Requesting new Spotify access token');

            // Encode client ID and secret for basic auth (browser-compatible)
            const authString = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

            // Request new token
            const response = await axios.post('https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${authString}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Save token and expiration time
            accessToken = response.data.access_token;
            // Set expiration time 5 minutes before actual expiry to be safe
            tokenExpirationTime = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);

            console.log('✅ Spotify access token obtained successfully');
            return accessToken;
        } catch (error) {
            console.error('❌ Error obtaining Spotify access token:', error.response?.data || error.message);
            throw error.response?.data?.message || 'Failed to obtain Spotify access token';
        }
    },

    // Get soundtrack for a movie by name
    getMovieSoundtrack: async (movieName) => {
        try {
            console.log('🎵 Fetching soundtrack for movie:', movieName);

            // Check if we have cached data for this movie
            const cacheKey = `soundtrack_${movieName}`;
            if (soundtrackCache.has(cacheKey)) {
                const cachedData = soundtrackCache.get(cacheKey);
                if (Date.now() < cachedData.expiry) {
                    console.log('🔄 Using cached soundtrack data for:', movieName);
                    return cachedData.data;
                } else {
                    console.log('⏰ Cache expired for:', movieName);
                }
            }

            // Get access token
            const token = await spotifyService.getAccessToken();

            // Try multiple search strategies in sequence
            const searchStrategies = [
                // Strategy 1: Exact movie name with soundtrack and Tamil
                `${movieName} Tamil soundtrack`,

                // Strategy 2: Movie name with soundtrack
                `${movieName} soundtrack`,

                // Strategy 3: Movie name with Tamil songs
                `${movieName} Tamil songs`,

                // Strategy 4: Movie name with music
                `${movieName} music`,

                // Strategy 5: Just the movie name (might find theme songs)
                movieName
            ];

            // Try each strategy until we find tracks
            for (const searchQuery of searchStrategies) {
                console.log(`Trying search query: "${searchQuery}"`);

                try {
                    const response = await axios.get('https://api.spotify.com/v1/search', {
                        params: {
                            q: searchQuery,
                            type: 'track',
                            limit: 10
                        },
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    // If we found tracks, cache and return them
                    if (response.data.tracks.items.length > 0) {
                        console.log(`✅ Found ${response.data.tracks.items.length} tracks with query: "${searchQuery}"`);

                        // Cache the results
                        soundtrackCache.set(cacheKey, {
                            data: response.data,
                            expiry: Date.now() + CACHE_EXPIRY
                        });

                        return response.data;
                    }
                } catch (strategyError) {
                    console.log(`Search strategy "${searchQuery}" failed:`, strategyError.message);
                    // Continue to next strategy
                }
            }

            // If all specific searches failed, try a more targeted fallback
            console.log('All specific searches failed, trying targeted fallback...');

            // Extract first word of movie title (often the most distinctive part)
            const firstWord = movieName.split(' ')[0];

            // Try a more targeted fallback with just the first word
            try {
                const targetedFallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
                    params: {
                        q: `${firstWord} Tamil song`,
                        type: 'track',
                        limit: 10
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // If we found tracks with the targeted fallback, cache and return them
                if (targetedFallbackResponse.data.tracks.items.length > 0) {
                    console.log(`✅ Found ${targetedFallbackResponse.data.tracks.items.length} tracks with targeted fallback`);

                    // Cache the results
                    soundtrackCache.set(cacheKey, {
                        data: targetedFallbackResponse.data,
                        expiry: Date.now() + CACHE_EXPIRY
                    });

                    return targetedFallbackResponse.data;
                }
            } catch (targetedError) {
                console.log('Targeted fallback failed:', targetedError.message);
            }

            // Last resort: generic Tamil movie songs
            console.log('All specific searches failed, using generic Tamil songs...');

            const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
                params: {
                    q: 'Popular Tamil songs',
                    type: 'track',
                    limit: 10
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Using generic Tamil songs as last resort');

            // Cache the generic results too
            soundtrackCache.set(cacheKey, {
                data: fallbackResponse.data,
                expiry: Date.now() + CACHE_EXPIRY
            });

            return fallbackResponse.data;

        } catch (error) {
            console.error('❌ Error fetching soundtrack:', error.response?.data || error.message);

            try {
                // If all searches fail, try a guaranteed working query
                console.log('All searches failed, using guaranteed Tamil songs query...');

                // Get access token
                const token = await spotifyService.getAccessToken();

                // Try searching for popular Tamil movie songs
                const fallbackResponse = await axios.get('https://api.spotify.com/v1/search', {
                    params: {
                        q: 'Popular Tamil songs',
                        type: 'track',
                        limit: 10
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('✅ Guaranteed Tamil songs retrieved successfully');
                return fallbackResponse.data;
            } catch (fallbackError) {
                console.error('❌ Even guaranteed search failed:', fallbackError.message);
                throw fallbackError.response?.data?.message || 'Failed to fetch any tracks';
            }
        }
    },

    // Get tracks directly from search results
    getTracksFromSearch: async (movieName) => {
        try {
            console.log('🎵 Searching for tracks related to:', movieName);

            // Normalize the movie name to improve search results
            const normalizedMovieName = movieName
                .replace(/[:\-–—]/g, '') // Remove colons, hyphens, dashes
                .replace(/\s+/g, ' ')    // Normalize spaces
                .trim();                 // Remove leading/trailing spaces

            console.log(`Normalized movie name: "${normalizedMovieName}"`);

            // Try with both original and normalized names
            let searchData;
            try {
                // First try with the normalized name
                searchData = await spotifyService.getMovieSoundtrack(normalizedMovieName);
            } catch (normalizedError) {
                console.log('Normalized name search failed, trying original name');

                // If that fails, try with the original name
                searchData = await spotifyService.getMovieSoundtrack(movieName);
            }

            // Format the tracks to match the playlist tracks format
            if (searchData.tracks && searchData.tracks.items.length > 0) {
                // Filter out tracks that don't have the movie name in their title or album
                // This helps ensure relevance
                const relevantTracks = searchData.tracks.items.filter(track => {
                    const trackTitle = track.name.toLowerCase();
                    const albumName = track.album?.name?.toLowerCase() || '';
                    const artistNames = track.artists.map(a => a.name.toLowerCase()).join(' ');
                    const movieNameLower = movieName.toLowerCase();

                    // Check if any part of the track info contains the movie name
                    return trackTitle.includes(movieNameLower) ||
                           albumName.includes(movieNameLower) ||
                           artistNames.includes(movieNameLower);
                });

                // If we have relevant tracks, use those, otherwise use all tracks
                const tracksToUse = relevantTracks.length > 0 ? relevantTracks : searchData.tracks.items;

                const formattedTracks = tracksToUse.map(track => ({
                    track: track
                }));

                console.log(`✅ Formatted ${formattedTracks.length} tracks successfully`);
                return formattedTracks;
            }

            throw new Error('No tracks found in search results');
        } catch (error) {
            console.error('❌ Error formatting tracks:', error.message);

            // Try one more time with a generic search as last resort
            try {
                console.log('Trying generic Tamil songs as last resort');
                const fallbackData = await spotifyService.getMovieSoundtrack('Popular Tamil songs');

                if (fallbackData.tracks && fallbackData.tracks.items.length > 0) {
                    const formattedTracks = fallbackData.tracks.items.map(track => ({
                        track: track
                    }));

                    console.log('✅ Using generic Tamil songs as fallback');
                    return formattedTracks;
                }
            } catch (fallbackError) {
                console.error('❌ Even fallback failed:', fallbackError.message);
            }

            throw error;
        }
    },

    // Get tracks from a specific playlist
    getPlaylistTracks: async (playlistId) => {
        try {
            console.log('🎵 Fetching tracks for playlist:', playlistId);

            // Get access token
            const token = await spotifyService.getAccessToken();

            // Check if this is an album ID (albums have different endpoints)
            if (playlistId.length === 22 && !playlistId.startsWith('37i9dQ')) {
                try {
                    // Try to fetch as an album first
                    console.log('Trying to fetch as album...');
                    return await spotifyService.getAlbumTracks(playlistId);
                } catch (albumError) {
                    console.log('Not an album, continuing as playlist...');
                    // If it fails, continue with playlist fetch
                }
            }

            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    limit: 10 // Limit to 10 tracks
                }
            });

            console.log('✅ Playlist tracks retrieved successfully');
            return response.data.items;
        } catch (error) {
            console.error('❌ Error fetching playlist tracks:', error.response?.data || error.message);

            try {
                // If playlist fetch fails, try a guaranteed working playlist
                console.log('Trying guaranteed working playlist...');
                const token = await spotifyService.getAccessToken();
                const guaranteedPlaylistId = spotifyService.getGuaranteedPlaylist();

                console.log(`Using guaranteed playlist: ${guaranteedPlaylistId}`);
                const response = await axios.get(`https://api.spotify.com/v1/playlists/${guaranteedPlaylistId}/tracks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        limit: 10 // Limit to 10 tracks
                    }
                });

                console.log('✅ Guaranteed playlist tracks retrieved successfully');
                return response.data.items;
            } catch (fallbackError) {
                console.error('❌ Even guaranteed playlist failed:', fallbackError.message);
                throw fallbackError.response?.data?.message || 'Failed to fetch any tracks';
            }
        }
    },

    // Get tracks from a specific album
    getAlbumTracks: async (albumId) => {
        try {
            console.log('🎵 Fetching tracks for album:', albumId);

            // Get access token
            const token = await spotifyService.getAccessToken();

            const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    limit: 10 // Limit to 10 tracks
                }
            });

            // Format album tracks to match playlist track format
            const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Transform the tracks to match playlist track format
            const formattedTracks = response.data.items.map(track => ({
                track: {
                    ...track,
                    album: albumResponse.data
                }
            }));

            console.log('✅ Album tracks retrieved successfully');
            return formattedTracks;
        } catch (error) {
            console.error('❌ Error fetching album tracks:', error.response?.data || error.message);

            try {
                // If album fetch fails, try a guaranteed working playlist
                console.log('Album fetch failed, trying guaranteed working playlist...');
                return await spotifyService.getPlaylistTracks(spotifyService.getGuaranteedPlaylist());
            } catch (fallbackError) {
                console.error('❌ Even guaranteed playlist failed:', fallbackError.message);
                throw fallbackError.response?.data?.message || 'Failed to fetch any tracks';
            }
        }
    }
};
