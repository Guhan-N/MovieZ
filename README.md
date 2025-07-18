# 🎬 MovieZ
<img width="1856" height="878" alt="image" src="https://github.com/user-attachments/assets/820a6da6-e863-4d45-952a-c3d3a2848402" />



## 📚 Table of Contents

* [About The Project](#about-the-project)
* [Features](#features)
* [Technologies Used](#technologies-used)
* [Database Schema](#database-schema)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Environment Variables](#environment-variables)
  * [Running the Project](#running-the-project)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## 📝 About The Project

**MovieZ** is a dynamic movie, TV show, and anime discovery platform for enthusiasts who want a seamless, modern, and personalized entertainment experience. With trending titles, detailed information, and user-focused features like watchlists and recommendations, MovieZ aims to be your all-in-one movie companion.

---

## 🚀 Features

### 🔍 Content Discovery

* Browse trending and popular movies, TV shows, and anime.
* Search and filter by genre and type.
* Featured content slider on homepage.

### 🔐 User Authentication

* Secure registration and login.
* Session management with Supabase Auth.

### 🎯 Personalized Experience

* **Watchlist** management.
* **Watch history** tracking with completion status.
* **Ratings** (1–5 stars).
* Tailored recommendations based on preferences and activity.

### 📄 Detailed Content Pages

* Overview, genres, release date, ratings, cast, trailers, and streaming availability.

### 💡 UI/UX

* Fully responsive (mobile, tablet, desktop).
* Dark/Light mode toggle.
* Interactive card actions (add/remove from watchlist, update status).

---

## 🛠 Technologies Used

### Frontend

* HTML5
* CSS3 (with CSS variables)
* JavaScript (Vanilla JS)
* [Vite](https://vitejs.dev/) for fast development and builds

### Libraries

* [@splidejs/splide](https://splidejs.com/) – Hero/content slider

### Backend & Database

* [Supabase](https://supabase.com/)

  * PostgreSQL database
  * Authentication
  * Row Level Security (RLS)

### External API

* [TMDB API](https://www.themoviedb.org/documentation/api) – Movie, TV & Anime metadata

---

## 🗃️ Database Schema

**Supabase PostgreSQL Tables:**

### `user_watch_history`

Tracks what users have watched.

### `user_ratings`

Stores user ratings for each content item.

### `user_preferences`

Saves preferred genres, actors, and types for recommendations.

### `user_watchlist`

Holds content users have added to their watchlist.

**All tables are secured with Row Level Security (RLS).**

---

## 🛠️ Getting Started

Follow these steps to run the project locally.

### ✅ Prerequisites

* Node.js (LTS recommended)
* npm or Yarn

### 📦 Installation

```bash
git clone https://github.com/Guhan-N/moviez.git
cd moviez
npm install
# or
yarn install
```

### 🔐 Environment Variables

Create a `.env` file in the root and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

### ▶️ Running the Project

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:5173` to view the app.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

**Project Author**: N. Guhan
**GitHub**: [@Guhan-N](https://github.com/Guhan-N)
**Live Site**: [https://Guhan-N.github.io/moviez](https://Guhan-N.github.io/moviez)

---

> Thanks for checking out MovieZ! ⭐ If you like it, consider giving the repo a star on GitHub!

