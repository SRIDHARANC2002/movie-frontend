import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

// Create a memoized selector
const selectUser = createSelector(
  state => state.auth.user,
  user => user
);

const Navbar = () => {
  // Use the memoized selector
  const user = useSelector(selectUser);
  
  // ... rest of the component code ...
}; 