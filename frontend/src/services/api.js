// services/api.js
// This file centralizes all API calls for the StudySync application.

// Base URLs for your backend servers
const FASTAPI_BASE_URL = "http://127.0.0.1:8000"; // FastAPI server for session management and focus analysis
const FLASK_BASE_URL = "http://127.0.0.1:5001";   // Flask server for raw emotion prediction

/**
 * Starts a new study session.
 * @returns {Promise<Object>} The session data, including session_id.
 */
export async function startSession() {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/start_session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Ensure content type is set
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to start session: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    console.log('Session started:', data);
    return data;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error; // Re-throw to be handled by the component
  }
}

/**
 * Ends an existing study session.
 * @param {number} sessionId - The ID of the session to end.
 * @returns {Promise<Object>} A confirmation message.
 */
export async function endSession(sessionId) {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/end_session/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Ensure content type is set
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to end session: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    console.log('Session ended:', data);
    return data;
  } catch (error) {
    console.error(`Error ending session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Predicts emotions from a base64 image using the Flask server.
 * @param {string} imageBase64 - The base64 encoded image string (e.g., "data:image/jpeg;base64,...").
 * @returns {Promise<Object>} The emotion prediction result (e.g., { emotion, confidence, probabilities }).
 */
export async function predictEmotion(imageBase664) {
  try {
    const response = await fetch(`${FLASK_BASE_URL}/predict_emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase664 }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to predict emotion: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error predicting emotion:', error);
    throw error;
  }
}

/**
 * Analyzes focus and logs attention metrics to the FastAPI server.
 * This function is now responsible for logging the attention record to the database
 * and returning the study state and attention score.
 * @param {number} sessionId - The ID of the current study session.
 * @param {Blob} imageBlob - The image data as a Blob.
 * @returns {Promise<Object>} Focus analysis result (e.g., { focused, attention_score, study_state }).
 */
export async function analyzeFocusAndLog(sessionId, imageBlob) {
  try {
    const formData = new FormData();
    formData.append("file", imageBlob, "webcam_capture.jpeg"); // Append the image blob as a file

    const response = await fetch(`${FASTAPI_BASE_URL}/analyze_focus/?session_id=${sessionId}`, {
      method: 'POST',
      body: formData, // FormData automatically sets Content-Type: multipart/form-data
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to analyze focus: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing focus and logging:', error);
    throw error;
  }
}

/**
 * Fetches all study sessions from the FastAPI server.
 * @returns {Promise<Array<Object>>} A list of all study sessions.
 */
export async function getAllSessions() {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/sessions/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch sessions: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    throw error;
  }
}

/**
 * Fetches metrics for a specific session from the FastAPI server.
 * @param {number} sessionId - The ID of the session to fetch metrics for.
 * @returns {Promise<Object>} The session metrics.
 */
export async function getSessionMetrics(sessionId) {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/session_metrics/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch session metrics: ${errorData.detail || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching metrics for session ${sessionId}:`, error);
    throw error;
  }
}
