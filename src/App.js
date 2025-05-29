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
import axios from 'axios';

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
  ];

  useEffect(() => {
    // Get document URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    
    if (!url) {
      setError('No document URL provided');
      return;
    }

    try {
      const decodedUrl = decodeURIComponent(url);
      // Validate URL
      new URL(decodedUrl);
      setDocumentUrl(decodedUrl);
    } catch (err) {
      console.error('Invalid URL:', err);
      setError('Invalid document URL provided');
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

      // Fetch the document content through our proxy
      const proxyUrl = `/proxy?url=${encodeURIComponent(documentUrl)}`;
      const response = await axios.get(proxyUrl, {
        responseType: 'blob'
      });

      // Create a blob URL for the document
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = URL.createObjectURL(blob);

      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      printFrameRef.current = iframe;

      // Write the document content to the iframe
      iframe.onload = () => {
        try {
          // Trigger print dialog
          iframe.contentWindow.print();
          setPrintStatus('printing');

          // Clean up after printing
          setTimeout(() => {
            // Revoke the blob URL
            URL.revokeObjectURL(blobUrl);
            
            // Remove the iframe
            if (printFrameRef.current) {
              document.body.removeChild(printFrameRef.current);
              printFrameRef.current = null;
            }
            
            setPrintStatus('completed');
            setLoading(false);
            
            // Close the window after a delay
            setTimeout(() => {
              window.close();
            }, 2000);
          }, 1000);
        } catch (printError) {
          console.error('Print error:', printError);
          setError('Failed to trigger print dialog. Please try again.');
          setLoading(false);
          
          // Clean up
          URL.revokeObjectURL(blobUrl);
          if (printFrameRef.current) {
            document.body.removeChild(printFrameRef.current);
            printFrameRef.current = null;
          }
        }
      };

      // Write the document to the iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>Print Document</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <embed src="${blobUrl}" type="${response.headers['content-type']}" width="100%" height="100%" />
          </body>
        </html>
      `);
      iframeDoc.close();

    } catch (err) {
      console.error('Print error:', err);
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

          {documentUrl && (
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
          )}

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