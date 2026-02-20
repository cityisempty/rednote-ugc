import { Router } from 'express';
import { getNotes, getNote, updateNote, deleteNote } from '../controllers/notesController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getNotes);
router.get('/:id', authenticate, getNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);
export default router;
