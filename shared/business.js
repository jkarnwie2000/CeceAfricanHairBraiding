/**
 * Single source of truth for business details.
 * Imported by BOTH the Express server (booking logic, emails) and the React client (footer, contact page, SEO).
 * Replace the placeholder address / phone / email / social links with the real business details before launch.
 */
export const BUSINESS = {
  name: 'Cece African Hair Braiding',
  shortName: 'Cece',
  tagline: 'Artistry in every braid. Heritage in every strand.',
  description:
    'African-owned hair braiding salon and beauty supply store specializing in box braids, knotless braids, twists, cornrows and premium hair care products.',
  phone: '(404) 555-0182',
  phoneHref: '+14045550182',
  email: 'hello@ceceafricanhair.com',
  address: {
    line1: '2418 Heritage Avenue, Suite B',
    city: 'Atlanta',
    state: 'GA',
    postalCode: '30310',
    country: 'US',
  },
  mapUrl: 'https://maps.google.com/?q=Atlanta,+GA+30310',
  timezone: 'America/New_York',
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/',
    youtube: 'https://youtube.com/',
  },
  /**
   * Weekly opening hours, keyed by JS weekday (0 = Sunday … 6 = Saturday).
   * `null` means closed. Times are 24h "HH:MM" in the salon's local timezone.
   */
  hours: {
    0: { open: '12:00', close: '17:00' },
    1: null,
    2: { open: '09:00', close: '19:00' },
    3: { open: '09:00', close: '19:00' },
    4: { open: '09:00', close: '19:00' },
    5: { open: '09:00', close: '20:00' },
    6: { open: '08:00', close: '18:00' },
  },
};

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Booking rules shared by server validation and client messaging. */
export const BOOKING_POLICY = {
  slotIntervalMinutes: 30,
  minLeadHours: 3,
  maxDaysAhead: 60,
  cancellationWindowHours: 24,
};

/** Shipping / tax display defaults (the server's .env values are authoritative). */
export const SHOP_POLICY = {
  freeShippingThreshold: 75,
  returnWindowDays: 30,
};
