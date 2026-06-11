// apps/api/server.js
import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3001;

// Disable SSL certificate verification for all database connections in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
