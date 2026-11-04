import { BUSINESS, BOOKING_POLICY, SHOP_POLICY } from '@shared/business.js';

export const testimonials = [
  {
    name: 'Amara J.',
    service: 'Knotless Braids',
    rating: 5,
    quote:
      'Cece and her team are true artists. My knotless braids were so neat and light — zero tension and I got compliments for weeks. The salon feels like home.',
  },
  {
    name: 'Keisha W.',
    service: 'Kids Braiding',
    rating: 5,
    quote:
      'My daughter usually dreads hair day, but she actually asked to come back! Gentle hands, beautiful beaded cornrows and so much patience.',
  },
  {
    name: 'Fatou D.',
    service: 'Fulani Braids',
    rating: 5,
    quote:
      'They understood exactly the Fulani look I wanted — it reminded me of home in Senegal. Booking online was easy and they started right on time.',
  },
  {
    name: 'Brianna O.',
    service: 'Passion Twists',
    rating: 5,
    quote:
      'Fast, friendly, and my passion twists lasted almost seven weeks. I also stock up on their chebe oil and edge control every visit.',
  },
];

export const whyChooseUs = [
  { title: 'Master braiders', text: 'Decades of combined experience in African braiding traditions, trained in the latest protective-style techniques.' },
  { title: 'Gentle on your scalp', text: 'Tension-conscious methods and knotless techniques that protect your edges and natural hair.' },
  { title: 'Premium hair included', text: 'Quality, itch-free pre-stretched hair is included in braiding prices — no extra trips to the store.' },
  { title: 'On time, every time', text: 'Online booking with real-time availability means no double-booking and no long waits.' },
];

export const faqs = [
  {
    category: 'Appointments',
    items: [
      {
        q: 'How do I book an appointment?',
        a: 'Choose your style on our Book page, pick an available date and time, and enter your details. You will receive a confirmation email immediately, and a second email once our team confirms your appointment.',
      },
      {
        q: 'Can I cancel or reschedule?',
        a: `Yes. Use the "Manage my appointment" link in your confirmation email or your account page to cancel or reschedule up to ${BOOKING_POLICY.cancellationWindowHours} hours before your appointment. Within ${BOOKING_POLICY.cancellationWindowHours} hours, please call us at ${BUSINESS.phone}.`,
      },
      {
        q: 'Is braiding hair included in the price?',
        a: 'Yes — premium pre-stretched braiding hair in standard colors (1, 1B, 2, 4) is included. Specialty colors, human hair and extra length may add to the final price; your braider will confirm before starting.',
      },
      {
        q: 'How should I prepare my hair?',
        a: 'Please arrive with hair washed, fully detangled, blow-dried and free of heavy product. If you need us to wash and blow-dry, add a note to your booking — an additional fee applies.',
      },
      {
        q: 'Why is my price listed as "from"?',
        a: 'Final prices depend on length, size and thickness. The starting price covers a standard medium size at mid-back length.',
      },
      {
        q: 'Do you braid children\'s hair?',
        a: 'Absolutely. Our Kids Braiding service is designed for ages 12 and under with gentle, low-tension styles. A parent or guardian must stay during the appointment.',
      },
    ],
  },
  {
    category: 'Shop & Orders',
    items: [
      {
        q: 'How much is shipping?',
        a: `Standard shipping is a flat rate and free on orders over $${SHOP_POLICY.freeShippingThreshold}. Orders ship within 1–2 business days and arrive in 3–7 business days within the United States.`,
      },
      {
        q: 'Is checkout secure?',
        a: 'Yes. Payments are processed by Stripe, a PCI-DSS Level 1 certified provider. Your card details are entered on Stripe\'s secure page and never touch or get stored on our servers.',
      },
      {
        q: 'Can I return a product?',
        a: `Unopened products in original packaging can be returned within ${SHOP_POLICY.returnWindowDays} days. For hygiene reasons, opened hair and hair-care products cannot be returned unless defective. See our Shipping & Returns policy for details.`,
      },
      {
        q: 'How do I track my order?',
        a: 'You will get an email when your order ships with tracking information. If you created an account, you can also see live order status under Account → Orders.',
      },
    ],
  },
];

const updated = 'November 2026';

export const legal = {
  privacy: {
    title: 'Privacy Policy',
    description: `How ${BUSINESS.name} collects, uses and protects your personal information.`,
    updated,
    sections: [
      ['Information we collect', 'When you book an appointment, create an account, place an order or contact us, we collect information such as your name, email address, phone number and shipping address. We also collect order and appointment history to provide our services.'],
      ['Payment information', 'All payments are processed by Stripe. Your card number, expiry date and security code are entered directly on Stripe\'s secure checkout page. We never receive, process or store your full card details.'],
      ['How we use your information', 'We use your information to schedule and manage appointments, fulfill and ship orders, send confirmations and service updates, respond to inquiries, and — only if you subscribe — send marketing emails. You can unsubscribe at any time.'],
      ['Cookies', 'We use a single essential, secure (httpOnly) cookie to keep you signed in, and your browser\'s local storage to remember your shopping cart. We do not use advertising trackers.'],
      ['Sharing', 'We never sell your personal information. We share it only with service providers who help us operate (payment processing, email delivery, shipping carriers) and only as needed to provide our services, or when required by law.'],
      ['Security', 'Passwords are hashed with bcrypt, all traffic is encrypted with HTTPS, and access to customer data is restricted to authorized staff.'],
      ['Your rights', `You may request access to, correction of, or deletion of your personal information by emailing ${BUSINESS.email}.`],
      ['Contact', `Questions about this policy? Contact us at ${BUSINESS.email} or ${BUSINESS.phone}.`],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    description: `Terms for using the ${BUSINESS.name} website, booking services and purchasing products.`,
    updated,
    sections: [
      ['Using our website', 'By using this website you agree to these terms. Please provide accurate information when booking, creating an account or placing an order.'],
      ['Appointments', `Appointment requests are confirmed by our team. Prices shown are starting prices; final pricing depends on length, size and hair type and will be confirmed before your service. Please arrive on time — arriving more than 20 minutes late may require rescheduling.`],
      ['Cancellations', `You may cancel or reschedule online up to ${BOOKING_POLICY.cancellationWindowHours} hours before your appointment. Repeated no-shows may require a deposit for future bookings.`],
      ['Product orders', 'All prices are in U.S. dollars. Orders are confirmed once payment is successfully processed by Stripe. We reserve the right to cancel and fully refund an order if an item becomes unavailable.'],
      ['Product use', 'Always perform a patch test before using new hair-care products. Discontinue use if irritation occurs. Our products are not intended to diagnose or treat any medical condition.'],
      ['Intellectual property', `All content on this website, including text, logos and images, belongs to ${BUSINESS.name} or its licensors and may not be reused without permission.`],
      ['Limitation of liability', 'To the maximum extent permitted by law, our liability is limited to the amount you paid for the service or product in question.'],
      ['Changes', 'We may update these terms from time to time. The latest version will always be posted on this page.'],
    ],
  },
  shipping: {
    title: 'Shipping & Returns',
    description: 'Shipping rates, delivery times and our return policy for beauty supply orders.',
    updated,
    sections: [
      ['Shipping rates', `We offer flat-rate standard shipping within the United States, and FREE shipping on orders of $${SHOP_POLICY.freeShippingThreshold} or more. The exact shipping cost is shown in your cart before checkout.`],
      ['Processing & delivery', 'Orders are processed within 1–2 business days (Monday–Friday). Standard delivery takes 3–7 business days after shipment. You will receive a tracking number by email when your order ships.'],
      ['Local pickup', 'Live nearby? Choose any delivery address and mention "pickup" in a message to us — we will set your order aside at the salon.'],
      ['Returns', `Unopened, unused products in their original packaging may be returned within ${SHOP_POLICY.returnWindowDays} days of delivery for a full refund of the product price. For hygiene reasons, opened braiding hair, extensions, wigs and hair-care products cannot be returned unless they arrive damaged or defective.`],
      ['Damaged or incorrect items', `If your order arrives damaged or incorrect, email ${BUSINESS.email} within 7 days with your order number and a photo. We will send a replacement or issue a full refund, including shipping.`],
      ['Refunds', 'Approved refunds are issued to your original payment method within 5–10 business days.'],
    ],
  },
};
