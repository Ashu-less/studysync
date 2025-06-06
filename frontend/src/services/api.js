import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const startSession = async () => {
  const response = await axios.post(`${API_BASE_URL}/start_session`);
  return response.data;
};

export const logFocus = async (sessionId, focused) => {
  return axios.post(`${API_BASE_URL}/log_focus`, {}, {
    params: { session_id: sessionId, focused },
  });
};

export const endSession = async (sessionId) => {
  const response = await axios.post(`${API_BASE_URL}/end_session`, {}, {
    params: { session_id: sessionId },
  });
  return response.data;
};

export const analyzeFocus = async (file) => {
  const formData = new FormData();
  formData.append("file", file, "screenshot.jpg");
  const response = await axios.post(`${API_BASE_URL}/analyze_focus/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
