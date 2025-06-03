import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // your FastAPI URL

export const startSession = async () => {
  const response = await axios.post(`${API_BASE_URL}/start_session`);
  return response.data;
};
