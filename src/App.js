import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printStatus, setPrintStatus] = useState('initializing');
  const [printMode, setPrintMode] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const printFrameRef = useRef(null);

  // Print modes
  const printModes = [
    { id: 'print', name: 'Print Document' },
    { id: 'pdf', name: 'Save as PDF' }
  ];

  useEffect(() => {
    // Get document URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    if (url) {
      setDocumentUrl(decodeURIComponent(url));
    } else {
      setError('No document URL provided');
    }
  }, []);

  const handlePrint = async () => {
    if (!documentUrl) {
      setError('No document URL available');
      return;
    }

    if (!printMode) {
      setError('Please select print mode');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPrintStatus('initializing');

      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      printFrameRef.current = iframe;

      // Load the document in the iframe
      iframe.src = documentUrl;

      // When iframe loads, trigger print dialog
      iframe.onload = () => {
        setPrintStatus('printing');
        
        if (printMode === 'print') {
          // For direct printing
          iframe.contentWindow.print();
        } else {
          // For PDF saving
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Save as PDF</title>
                  <style>
                    body { margin: 0; padding: 0; }
                    iframe { width: 100%; height: 100vh; border: none; }
                  </style>
                </head>
                <body>
                  <iframe src="${documentUrl}"></iframe>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }

        // Clean up after printing
        setTimeout(() => {
          if (printFrameRef.current) {
            document.body.removeChild(printFrameRef.current);
            printFrameRef.current = null;
          }
          setPrintStatus('completed');
          
          // Close the window after a delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }, 1000);
      };

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to print document');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Secure Print Service
          </Typography>

          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Print Mode</InputLabel>
              <Select
                value={printMode}
                label="Print Mode"
                onChange={(e) => setPrintMode(e.target.value)}
              >
                {printModes.map((mode) => (
                  <MenuItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={loading || !documentUrl || !printMode}
              sx={{ mt: 3 }}
            >
              Print Document
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 3 }}>
              <CircularProgress />
              <Typography>Preparing document for printing...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {printStatus === 'printing' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Printing document...
            </Alert>
          )}

          {printStatus === 'completed' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Document printed successfully
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App;