import { Router } from 'express';
import { getNotes, getNote, updateNote, deleteNote } from '../controllers/notesController';
import { getUserTransactions } from '../controllers/templatesController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getNotes);
router.get('/:id', authenticate, getNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

// Transactions
router.get('/transactions/list', authenticate, getUserTransactions);
export default router;
