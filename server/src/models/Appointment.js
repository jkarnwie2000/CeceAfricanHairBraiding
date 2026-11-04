import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
/** Statuses that occupy a chair (block the calendar). */
export const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed'];

const appointmentSchema = new mongoose.Schema(
  {
    confirmationCode: { type: String, required: true, unique: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    priceCents: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    /** Salon-local calendar date "YYYY-MM-DD" */
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    /** Minutes since midnight (salon-local) */
    startMinutes: { type: Number, required: true, min: 0, max: 1440 },
    endMinutes: { type: Number, required: true, min: 0, max: 1440 },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending', index: true },
    adminNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    manageTokenHash: { type: String, select: false },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    history: [
      {
        _id: false,
        action: String,
        detail: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

appointmentSchema.index({ date: 1, status: 1, startMinutes: 1 });
appointmentSchema.index({ 'customer.email': 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
