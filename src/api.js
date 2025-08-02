import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://customizer-backend-ttv5.onrender.com',
  baseURL: 'http://localhost:5000'
});

export default api; 