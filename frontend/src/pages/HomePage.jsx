import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";

/**
 * HomePage component serving as the dashboard for StudySync.
 * Currently provides placeholders for future analytics and key features.
 * @returns {JSX.Element} The rendered HomePage component.
 */
export default function HomePage() {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#7fb3ff', fontWeight: 'bold' }}>StudySync Dashboard</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Welcome! This dashboard will provide an overview of your study analytics, focus trends, and emotional history.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {/* Placeholder for graphs and analytics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, backgroundColor: '#23263a', color: 'white', borderRadius: 2, minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h5" align="center" sx={{ color: 'gray' }}>
              [Graphs and Analytics Coming Soon]
              <br/><br/>
              Start a session on the "Focus" page to generate data!
            </Typography>
          </Paper>
        </Grid>

        {/* Example Feature Sections (you can expand these) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, backgroundColor: '#23263a', color: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#7fb3ff', mb: 1 }}>Real-time Focus Monitoring</Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Utilizes your webcam to detect your attention levels and emotional state as you study, helping you stay on track.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, backgroundColor: '#23263a', color: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#7fb3ff', mb: 1 }}>Personalized Break Recommendations</Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Analyzes your focus patterns and suggests optimal times to take short breaks to improve productivity and prevent burnout.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
