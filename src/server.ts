import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const main = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server successfully started on port: ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

main();