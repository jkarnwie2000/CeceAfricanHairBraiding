import { Router } from 'express';
import * as c from '../controllers/appointmentController.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId, formLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';

const r = Router();
const admin = [requireAuth, requireAdmin];

// Public
r.get('/availability', validate(s.availabilityQuerySchema, 'query'), c.availability);
r.get('/available-dates', validate(s.availableDatesQuerySchema, 'query'), c.availableDates);
r.post('/', formLimiter, optionalAuth, validate(s.appointmentSchema), c.createAppointment);

// Logged-in customer
r.get('/mine', requireAuth, c.myAppointments);

// Admin
r.get('/admin/list', ...admin, validate(s.adminAppointmentQuerySchema, 'query'), c.adminListAppointments);
r.get('/admin/blocked-dates', ...admin, c.listBlockedDates);
r.post('/admin/blocked-dates', ...admin, validate(s.blockedDateSchema), c.addBlockedDate);
r.delete('/admin/blocked-dates/:id', ...admin, validObjectId(), c.removeBlockedDate);
r.patch('/admin/:id', ...admin, validObjectId(), validate(s.adminAppointmentUpdateSchema), c.adminUpdateAppointment);

// Manage via emailed token OR logged-in owner
r.get('/:id', validObjectId(), optionalAuth, c.getManagedAppointment);
r.post('/:id/cancel', formLimiter, validObjectId(), optionalAuth, validate(s.cancelAppointmentSchema), c.cancelAppointment);
r.post('/:id/reschedule', formLimiter, validObjectId(), optionalAuth, validate(s.rescheduleSchema), c.rescheduleAppointment);

export default r;
