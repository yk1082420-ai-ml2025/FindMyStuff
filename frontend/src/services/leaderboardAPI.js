import axios from 'axios';

// eslint-disable-next-line no-undef
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const leaderboardAPI = {
  // Get current month leaderboard
  getCurrentLeaderboard: () => axios.get(`${API_URL}/leaderboard/current`),
  
  // Get logged‑in user's points & rank
  getMyPoints: () => axios.get(`${API_URL}/leaderboard/me`),
  
  // Get leaderboard filtered by faculty (optional)
  getLeaderboardByFaculty: (faculty) => axios.get(`${API_URL}/leaderboard/faculty/${faculty}`),
};