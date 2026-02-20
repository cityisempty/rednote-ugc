import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import rechargeRoutes from './routes/rechargeRoutes';
import generateRoutes from './routes/generateRoutes';
import notesRoutes from './routes/notesRoutes';
import templatesRoutes from './routes/templatesRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({ origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
