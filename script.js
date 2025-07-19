// MovieZ - Movie Discovery App
import { createClient } from '@supabase/supabase-js';

// Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Global state
let currentUser = null;
let currentPage = 'home';
let searchTimeout = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('MovieZ App Initializing...');
    console.log('TMDB API Key:', TMDB_API_KEY ? 'Present' : 'Missing');
    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
    
    initializeApp();
});

async function initializeApp() {
    try {
        // Check authentication state
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUser = user;
                updateAuthUI();
            }
        }

        // Initialize UI components
        initializeNavigation();
        initializeSearch();
        initializeTheme();
        initializeMobileMenu();
        
        // Load initial content
        await loadHomePage();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

// Navigation
function initializeNavigation() {
    // Desktop navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.id;
            navigateToPage(page);
        });
    });

    // Mobile navigation
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
            closeMobileMenu();
        });
    });
}

function navigateToPage(page) {
    // Update active states
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Set active state
    const desktopLink = document.getElementById(page);
    if (desktopLink) desktopLink.classList.add('active');
    
    const mobileLink = document.querySelector(`[data-page="${page}"]`);
    if (mobileLink) mobileLink.classList.add('active');

    currentPage = page;

    // Load page content
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'movies':
            loadMoviesPage();
            break;
        case 'tvshows':
            loadTVShowsPage();
            break;
        case 'anime':
            loadAnimePage();
            break;
        case 'profile':
            loadProfilePage();
            break;
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search');
    const mobileSearchInput = document.getElementById('mobile-search');
    const contentTypeSelect = document.getElementById('content-type');
    const mobileContentTypeSelect = document.getElementById('mobile-content-type');
    const genreSelect = document.getElementById('genre-select');
    const mobileGenreSelect = document.getElementById('mobile-genre-select');

    // Load genres
    loadGenres();

    // Search event listeners
    [searchInput, mobileSearchInput].forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(e.target.value);
                }, 500);
            });
        }
    });

    // Filter event listeners
    [contentTypeSelect, mobileContentTypeSelect, genreSelect, mobileGenreSelect].forEach(select => {
        if (select) {
            select.addEventListener('change', () => {
                const searchTerm = searchInput?.value || mobileSearchInput?.value || '';
                performSearch(searchTerm);
            });
        }
    });
}

async function loadGenres() {
    if (!TMDB_API_KEY) {
        console.warn('TMDB API key not found');
        return;
    }

    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`).then(r => r.json())
        ]);

        const allGenres = [...movieGenres.genres, ...tvGenres.genres];
        const uniqueGenres = allGenres.filter((genre, index, self) => 
            index === self.findIndex(g => g.id === genre.id)
        );

        const genreSelects = [
            document.getElementById('genre-select'),
            document.getElementById('mobile-genre-select')
        ];

        genreSelects.forEach(select => {
            if (select) {
                uniqueGenres.forEach(genre => {
                    const option = document.createElement('option');
                    option.value = genre.id;
                    option.textContent = genre.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

async function performSearch(query) {
    if (!TMDB_API_KEY) {
        showError('API configuration missing');
        return;
    }

    const contentType = document.getElementById('content-type')?.value || 
                       document.getElementById('mobile-content-type')?.value || 'all';
    const genreId = document.getElementById('genre-select')?.value || 
                   document.getElementById('mobile-genre-select')?.value || '';

    try {
        let results = [];

        if (query.trim()) {
            // Search by query
            if (contentType === 'all') {
                const [movieResults, tvResults] = await Promise.all([
                    fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`).then(r => r.json()),
                    fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`).then(r => r.json())
                ]);
                results = [
                    ...movieResults.results.map(item => ({...item, media_type: 'movie'})),
                    ...tvResults.results.map(item => ({...item, media_type: 'tv'}))
                ];
            } else {
                const endpoint = contentType === 'movie' ? 'search/movie' : 'search/tv';
                const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                results = data.results.map(item => ({...item, media_type: contentType}));
            }
        } else {
            // Discover by filters
            if (contentType === 'all') {
                const [movieResults, tvResults] = await Promise.all([
                    fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}${genreId ? `&with_genres=${genreId}` : ''}`).then(r => r.json()),
                    fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}${genreId ? `&with_genres=${genreId}` : ''}`).then(r => r.json())
                ]);
                results = [
                    ...movieResults.results.map(item => ({...item, media_type: 'movie'})),
                    ...tvResults.results.map(item => ({...item, media_type: 'tv'}))
                ];
            } else {
                const endpoint = contentType === 'movie' ? 'discover/movie' : 'discover/tv';
                const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}${genreId ? `&with_genres=${genreId}` : ''}`);
                const data = await response.json();
                results = data.results.map(item => ({...item, media_type: contentType}));
            }
        }

        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed');
    }
}

function displaySearchResults(results) {
    const main = document.getElementById('main');
    
    if (results.length === 0) {
        main.innerHTML = `
            <div class="content-section">
                <h2>No Results Found</h2>
                <p>Try adjusting your search terms or filters.</p>
            </div>
        `;
        return;
    }

    main.innerHTML = `
        <div class="content-section">
            <h2>Search Results (${results.length})</h2>
            <div class="movies-grid" id="search-results"></div>
        </div>
    `;

    const grid = document.getElementById('search-results');
    results.forEach(item => {
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}

// Theme functionality
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Mobile menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuOverlay = document.getElementById('mobile-sidebar-menu');
    const closeMobileMenuBtn = document.querySelector('.close-mobile-menu');

    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuOverlay.classList.add('active');
    });

    closeMobileMenuBtn.addEventListener('click', closeMobileMenu);

    // Close on overlay click
    mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobile-sidebar-menu');
    mobileMenuOverlay.classList.remove('active');
}

// Page loading functions
async function loadHomePage() {
    if (!TMDB_API_KEY) {
        showError('TMDB API key is required to load content. Please check your environment variables.');
        return;
    }

    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="hero-section splide">
            <div class="splide__track">
                <div class="splide__list" id="hero-slider"></div>
            </div>
        </div>
        <div class="content-section">
            <h2>Trending Now</h2>
            <div class="movies-grid" id="trending-grid"></div>
            
            <h2>Popular Movies</h2>
            <div class="movies-grid" id="movies-grid"></div>
            
            <h2>Popular TV Shows</h2>
            <div class="movies-grid" id="tvshows-grid"></div>
        </div>
    `;

    try {
        // Load content in parallel
        await Promise.all([
            loadHeroSlider(),
            loadTrending(),
            loadPopularMovies(),
            loadPopularTVShows()
        ]);
    } catch (error) {
        console.error('Error loading home page:', error);
        showError('Failed to load content');
    }
}

async function loadHeroSlider() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const heroSlider = document.getElementById('hero-slider');
        
        if (!heroSlider) return;

        // Take first 5 items for hero slider
        const heroItems = data.results.slice(0, 5);
        
        heroItems.forEach(item => {
            const slide = document.createElement('div');
            slide.className = 'splide__slide hero-slide';
            slide.style.backgroundImage = `url(${TMDB_BACKDROP_BASE_URL}${item.backdrop_path})`;
            
            slide.innerHTML = `
                <div class="hero-content">
                    <h2>${item.title || item.name}</h2>
                    <p>${item.overview ? item.overview.substring(0, 200) + '...' : 'No description available.'}</p>
                    <div class="hero-buttons">
                        <button class="hero-btn primary" onclick="viewDetails('${item.id}', '${item.media_type || (item.title ? 'movie' : 'tv')}')">
                            ▶ Watch Now
                        </button>
                        <button class="hero-btn secondary" onclick="viewDetails('${item.id}', '${item.media_type || (item.title ? 'movie' : 'tv')}')">
                            ℹ More Info
                        </button>
                    </div>
                </div>
            `;
            
            heroSlider.appendChild(slide);
        });

        // Initialize Splide slider
        if (window.Splide) {
            new window.Splide('.hero-section', {
                type: 'loop',
                autoplay: true,
                interval: 5000,
                arrows: false,
                pagination: true,
            }).mount();
        }
    } catch (error) {
        console.error('Error loading hero slider:', error);
    }
}

async function loadTrending() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const grid = document.getElementById('trending-grid');
        
        if (!grid) return;

        data.results.slice(0, 12).forEach(item => {
            const card = createMovieCard(item);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading trending:', error);
    }
}

async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const grid = document.getElementById('movies-grid');
        
        if (!grid) return;

        data.results.slice(0, 12).forEach(item => {
            const card = createMovieCard({...item, media_type: 'movie'});
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading popular movies:', error);
    }
}

async function loadPopularTVShows() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const grid = document.getElementById('tvshows-grid');
        
        if (!grid) return;

        data.results.slice(0, 12).forEach(item => {
            const card = createMovieCard({...item, media_type: 'tv'});
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading popular TV shows:', error);
    }
}

async function loadMoviesPage() {
    if (!TMDB_API_KEY) {
        showError('TMDB API key is required');
        return;
    }

    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="content-section">
            <h2>Popular Movies</h2>
            <div class="movies-grid" id="movies-page-grid"></div>
        </div>
    `;

    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const grid = document.getElementById('movies-page-grid');
        
        data.results.forEach(item => {
            const card = createMovieCard({...item, media_type: 'movie'});
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading movies page:', error);
        showError('Failed to load movies');
    }
}

async function loadTVShowsPage() {
    if (!TMDB_API_KEY) {
        showError('TMDB API key is required');
        return;
    }

    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="content-section">
            <h2>Popular TV Shows</h2>
            <div class="movies-grid" id="tv-page-grid"></div>
        </div>
    `;

    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        const grid = document.getElementById('tv-page-grid');
        
        data.results.forEach(item => {
            const card = createMovieCard({...item, media_type: 'tv'});
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading TV shows page:', error);
        showError('Failed to load TV shows');
    }
}

async function loadAnimePage() {
    if (!TMDB_API_KEY) {
        showError('TMDB API key is required');
        return;
    }

    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="content-section">
            <h2>Popular Anime</h2>
            <div class="movies-grid" id="anime-page-grid"></div>
        </div>
    `;

    try {
        // Search for anime using keywords and genres
        const response = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_genres=16`);
        const data = await response.json();
        const grid = document.getElementById('anime-page-grid');
        
        data.results.forEach(item => {
            const card = createMovieCard({...item, media_type: 'anime'});
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading anime page:', error);
        showError('Failed to load anime');
    }
}

function loadProfilePage() {
    if (!currentUser) {
        const main = document.getElementById('main');
        main.innerHTML = `
            <div class="content-section">
                <div class="auth-required">
                    <h2>Login Required</h2>
                    <p>Please log in to view your profile and manage your watchlist.</p>
                    <button class="auth-btn" onclick="document.getElementById('login-modal').style.display='block'">
                        Login
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="content-section">
            <div class="profile-header">
                <h1>Welcome, ${currentUser.email}</h1>
                <p>Manage your watchlist and view your activity</p>
            </div>
            
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="watchlist">Watchlist</button>
                <button class="tab-btn" data-tab="history">Watch History</button>
                <button class="tab-btn" data-tab="ratings">My Ratings</button>
            </div>
            
            <div class="tab-content">
                <div class="tab-pane active" id="watchlist-tab">
                    <div class="section-header">
                        <h2>Your Watchlist</h2>
                        <p>Movies and shows you want to watch</p>
                    </div>
                    <div class="movies-grid" id="watchlist-grid">
                        <div class="loading">Loading watchlist...</div>
                    </div>
                </div>
                
                <div class="tab-pane" id="history-tab">
                    <div class="section-header">
                        <h2>Watch History</h2>
                        <p>Content you've watched recently</p>
                    </div>
                    <div class="movies-grid" id="history-grid">
                        <div class="loading">Loading history...</div>
                    </div>
                </div>
                
                <div class="tab-pane" id="ratings-tab">
                    <div class="section-header">
                        <h2>Your Ratings</h2>
                        <p>Movies and shows you've rated</p>
                    </div>
                    <div class="movies-grid" id="ratings-grid">
                        <div class="loading">Loading ratings...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize profile tabs
    initializeProfileTabs();
    
    // Load initial tab content
    loadWatchlist();
}

function initializeProfileTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Load tab content
            switch(tabName) {
                case 'watchlist':
                    loadWatchlist();
                    break;
                case 'history':
                    loadWatchHistory();
                    break;
                case 'ratings':
                    loadUserRatings();
                    break;
            }
        });
    });
}

// Movie card creation
function createMovieCard(item) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const title = item.title || item.name;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    const mediaType = item.media_type || 'movie';
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterPath}" alt="${title}" loading="lazy">
            ${currentUser ? `
                <div class="card-actions">
                    <button class="action-btn" onclick="toggleWatchlist('${item.id}', '${mediaType}', '${title.replace(/'/g, "\\'")}', '${item.poster_path || ''}', '${JSON.stringify(item.genre_ids || []).replace(/"/g, '&quot;')}')" title="Add to Watchlist">
                        ❤
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="movie-info">
            <h3>${title}</h3>
            <div class="rating">⭐ ${rating}</div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
            viewDetails(item.id, mediaType);
        }
    });
    
    return card;
}

// Utility functions
function showError(message) {
    console.error(message);
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="content-section">
            <div class="error-state">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
}

// Global functions for HTML onclick handlers
window.viewDetails = function(id, mediaType) {
    console.log(`Viewing details for ${mediaType} ${id}`);
    // This would typically navigate to a details page
    // For now, just log the action
};

window.toggleWatchlist = async function(contentId, contentType, title, posterPath, genres) {
    if (!currentUser || !supabase) {
        document.getElementById('login-modal').style.display = 'block';
        return;
    }

    try {
        // Check if item is already in watchlist
        const { data: existing } = await supabase
            .from('user_watchlist')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('content_id', contentId)
            .eq('content_type', contentType);

        if (existing && existing.length > 0) {
            // Remove from watchlist
            await supabase
                .from('user_watchlist')
                .delete()
                .eq('id', existing[0].id);
            console.log('Removed from watchlist');
        } else {
            // Add to watchlist
            await supabase
                .from('user_watchlist')
                .insert({
                    user_id: currentUser.id,
                    content_id: contentId,
                    content_type: contentType,
                    title: title,
                    poster_path: posterPath,
                    genres: JSON.parse(genres.replace(/&quot;/g, '"'))
                });
            console.log('Added to watchlist');
        }
    } catch (error) {
        console.error('Error toggling watchlist:', error);
    }
};

// Authentication functions
window.handleLogin = async function(event) {
    event.preventDefault();
    
    if (!supabase) {
        alert('Authentication not configured');
        return;
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        updateAuthUI();
        document.getElementById('login-modal').style.display = 'none';
        
        // Reload current page to show user-specific content
        navigateToPage(currentPage);
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
};

window.handleSignup = async function(event) {
    event.preventDefault();
    
    if (!supabase) {
        alert('Authentication not configured');
        return;
    }

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        alert('Account created successfully! Please check your email for verification.');
        document.getElementById('signup-modal').style.display = 'none';
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
};

window.handleLogout = async function() {
    if (!supabase) return;

    try {
        await supabase.auth.signOut();
        currentUser = null;
        updateAuthUI();
        
        // Reload current page
        navigateToPage(currentPage);
    } catch (error) {
        console.error('Logout error:', error);
    }
};

function updateAuthUI() {
    const authContainer = document.querySelector('.auth-container');
    const userInfo = document.querySelector('.user-info');
    const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
    const mobileUserInfo = document.querySelector('.mobile-user-info');

    if (currentUser) {
        // Desktop
        if (authContainer) authContainer.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.querySelector('.user-email').textContent = currentUser.email;
        }

        // Mobile
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'none';
        if (mobileUserInfo) {
            mobileUserInfo.style.display = 'flex';
            mobileUserInfo.querySelector('.mobile-user-email').textContent = currentUser.email;
        }
    } else {
        // Desktop
        if (authContainer) authContainer.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';

        // Mobile
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'flex';
        if (mobileUserInfo) mobileUserInfo.style.display = 'none';
    }
}

// Watchlist functions (placeholder implementations)
async function loadWatchlist() {
    const grid = document.getElementById('watchlist-grid');
    if (!grid || !currentUser || !supabase) return;

    try {
        const { data, error } = await supabase
            .from('user_watchlist')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('added_at', { ascending: false });

        if (error) throw error;

        grid.innerHTML = '';
        
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Your watchlist is empty</h3>
                    <p>Add movies and shows you want to watch later</p>
                </div>
            `;
            return;
        }

        data.forEach(item => {
            const card = createWatchlistCard(item);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading watchlist:', error);
        grid.innerHTML = `
            <div class="error-state">
                <h3>Error loading watchlist</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

function createWatchlistCard(item) {
    const card = document.createElement('div');
    card.className = 'movie-card watchlist-card';
    
    const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterPath}" alt="${item.title}" loading="lazy">
            <div class="card-actions">
                <button class="action-btn remove-btn" onclick="removeFromWatchlist('${item.id}')" title="Remove from Watchlist">
                    ✕
                </button>
            </div>
        </div>
        <div class="movie-info">
            <h3>${item.title}</h3>
            <div class="added-date">Added ${new Date(item.added_at).toLocaleDateString()}</div>
            ${item.genres && item.genres.length > 0 ? `
                <div class="genres">
                    ${item.genres.slice(0, 2).map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
            viewDetails(item.content_id, item.content_type);
        }
    });
    
    return card;
}

window.removeFromWatchlist = async function(watchlistId) {
    if (!supabase) return;

    try {
        await supabase
            .from('user_watchlist')
            .delete()
            .eq('id', watchlistId);
        
        // Reload watchlist
        loadWatchlist();
    } catch (error) {
        console.error('Error removing from watchlist:', error);
    }
};

async function loadWatchHistory() {
    const grid = document.getElementById('history-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-state">
            <h3>No watch history</h3>
            <p>Your viewing history will appear here</p>
        </div>
    `;
}

async function loadUserRatings() {
    const grid = document.getElementById('ratings-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-state">
            <h3>No ratings yet</h3>
            <p>Rate movies and shows to see them here</p>
        </div>
    `;
}