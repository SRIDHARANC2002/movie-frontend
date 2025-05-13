import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Home = React.lazy(() => import("../pages/JavaScript/Home.jsx"));
const WatchList = React.lazy(() => import("../pages/JavaScript/WatchList.jsx"));
const Details = React.lazy(() => import("../pages/JavaScript/Details.jsx"));
const NotFound = React.lazy(() => import("../pages/JavaScript/NotFound.jsx"));
const Search = React.lazy(() => import("../pages/JavaScript/Search.jsx"));
const Register = React.lazy(() => import("../pages/JavaScript/Register.jsx"));
const Login = React.lazy(() => import("../pages/JavaScript/Login.jsx"));
const Profile = React.lazy(() => import("../pages/JavaScript/Profile.jsx"));
const MovieDetails = React.lazy(() => import("../pages/JavaScript/MovieDetails.jsx"));
const Favorites = React.lazy(() => import("../pages/JavaScript/Favorites.jsx"));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function RoutesConfig() {
  // Get authentication state from Redux
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<h3>Please wait while loading the page...</h3>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Root path redirects to home if authenticated, otherwise to login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchList"
          element={
            <ProtectedRoute>
              <WatchList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/details/:id"
          element={
            <ProtectedRoute>
              <Details />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default RoutesConfig;