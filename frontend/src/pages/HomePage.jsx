import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function HomePage() {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom>StudySync Dashboard</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Welcome! Here you can view your study analytics, focus trends, and emotional history.
      </Typography>
      <Paper sx={{ p: 4, mt: 4, minHeight: 300, backgroundColor: '#23263a', color: 'white' }}>
        {/* Placeholder for graphs */}
        <Typography variant="h5" align="center">[Graphs and Analytics Coming Soon]</Typography>
      </Paper>
    </Box>
  );
} 