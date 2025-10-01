function handleError(err, req, res) {
    if (res.writableEnded) return;
    res.statusCode = err.statusCode || 500;
    const msg = process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || String(err));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(msg);
  }
  
  export default handleError;
  