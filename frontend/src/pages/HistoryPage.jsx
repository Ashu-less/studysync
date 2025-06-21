import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function HistoryPage() {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom>Session History</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Here you will find a list of your past study sessions and emotional states.
      </Typography>
      <Paper sx={{ p: 4, mt: 4, minHeight: 300, backgroundColor: '#23263a', color: 'white' }}>
        {/* Placeholder for session history */}
        <Typography variant="h5" align="center">[Session History Coming Soon]</Typography>
      </Paper>
    </Box>
  );
} 