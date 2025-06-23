import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText, CircularProgress, Alert } from "@mui/material";
import { getAllSessions } from "../services/api"; // Import the new API function

/**
 * HistoryPage component to display a list of past study sessions.
 * Fetches session data from the FastAPI backend.
 * @returns {JSX.Element} The rendered HistoryPage component.
 */
export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    /**
     * Fetches all study sessions from the backend.
     */
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await getAllSessions();
        // Sort sessions by start_time in descending order (most recent first)
        const sortedData = data.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        setSessions(sortedData);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load session history. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#7fb3ff', fontWeight: 'bold' }}>Session History</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Here you will find a list of your past study sessions, including their duration and average attention scores.
      </Typography>

      <Paper sx={{ p: 4, mt: 4, minHeight: 300, backgroundColor: '#23263a', color: 'white', borderRadius: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress sx={{ color: '#7fb3ff' }} />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading sessions...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2, justifyContent: 'center' }}>
            {error}
          </Alert>
        )}
        {!loading && !error && sessions.length === 0 && (
          <Typography variant="h5" align="center" sx={{ color: 'gray', mt: 8 }}>
            No study sessions recorded yet. Start one on the Focus page!
          </Typography>
        )}
        {!loading && !error && sessions.length > 0 && (
          <List>
            {sessions.map((session) => (
              <ListItem
                key={session.id}
                sx={{
                  borderBottom: '1px solid #444',
                  py: 2,
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { backgroundColor: '#33364a', borderRadius: 1 },
                }}
              >
                <ListItemText
                  primary={`Session ID: ${session.id}`}
                  secondary={
                    <React.Fragment>
                      <Typography component="span" variant="body2" color="gray">
                        Start Time: {new Date(session.start_time).toLocaleString()}
                        <br />
                        {session.end_time && `End Time: ${new Date(session.end_time).toLocaleString()}`}
                        {session.total_duration !== null && ` | Duration: ${session.total_duration?.toFixed(1)} minutes`}
                        {session.average_attention_score !== null && ` | Avg. Attention: ${session.average_attention_score?.toFixed(1)}%`}
                        {session.recommended_break_duration !== null && ` | Recommended Break: ${session.recommended_break_duration} mins`}
                      </Typography>
                    </React.Fragment>
                  }
                  primaryTypographyProps={{ color: '#7fb3ff', fontWeight: 'bold' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
