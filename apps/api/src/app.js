// apps/api/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/sales', saleRoutes);
app.use('/stock', stockRoutes);
app.use('/reports', reportRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
