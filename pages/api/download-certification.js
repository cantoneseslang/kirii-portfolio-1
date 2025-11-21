// Deprecated: direct client Drive helpers were removed. This endpoint now redirects
// to a simple Drive download URL when fileId is provided, or returns 400 otherwise.

export default function handler(req, res) {
  console.log('API called with query:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileId, filename } = req.query;

  try {
    console.log('Processing request for:', { category, filename });
    
    if (fileId) {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return res.redirect(downloadUrl);
    }
    return res.status(400).json({ message: 'fileId is required' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error occurred' });
  }
} 