import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Layout/JavaScript/Navbar";
import Home from "./pages/JavaScript/Home";
import Search from "./pages/JavaScript/Search";
import MovieDetails from "./pages/JavaScript/MovieDetails";
import WatchList from "./pages/JavaScript/Watchlist";
import Favorites from "./pages/JavaScript/Favorites";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/watchlist" element={<WatchList />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </div>
  );
}

export default App;
