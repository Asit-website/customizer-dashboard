import axios from 'axios';

const api = axios.create({
  baseURL: 'https://customizer-backend-ttv5.onrender.com',
});

export default api; 