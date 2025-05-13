import axios from "axios";
import axiosAuth from "./axiosAuth";

export const axiosPublic = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  params: {
    api_key: process.env.REACT_APP_API_KEY,
  },
});

// Export both authenticated and public instances
export { axiosAuth };
export default axiosPublic;