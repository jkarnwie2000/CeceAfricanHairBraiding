import { BUSINESS, BOOKING_POLICY } from '../../../shared/business.js';
import { env } from '../config/env.js';
import { escapeHtml as e, formatMoney } from '../utils/strings.js';
import { formatDateLong, formatMinutes, formatDuration } from '../utils/time.js';

const C = { cream: '#FBF7F0', brown: '#3B2416', gold: '#B8862F', text: '#2A211C', muted: '#6E6259', line: '#E8DDCD' };

function layout(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${e(title)}</title></head>
<body style="margin:0;background:${C.cream};font-family:Georgia,'Times New Roman',serif;color:${C.text}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${C.line};border-radius:12px;overflow:hidden">
<tr><td style="background:${C.brown};padding:24px 28px;text-align:center">
<div style="font-size:24px;color:#fff;letter-spacing:.5px">Cece</div>
<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:${C.gold};text-transform:uppercase;margin-top:4px">African Hair Braiding</div>
</td></tr>
<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${C.line};font-family:Arial,sans-serif;font-size:12px;color:${C.muted};text-align:center">
${e(BUSINESS.name)} · ${e(BUSINESS.address.line1)}, ${e(BUSINESS.address.city)}, ${e(BUSINESS.address.state)} ${e(BUSINESS.address.postalCode)}<br>
${e(BUSINESS.phone)} · <a href="mailto:${e(BUSINESS.email)}" style="color:${C.gold}">${e(BUSINESS.email)}</a>
</td></tr></table></td></tr></table></body></html>`;
}

const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${e(href)}" style="background:${C.brown};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;display:inline-block;font-weight:bold">${e(label)}</a></p>`;

const row = (label, value) =>
  `<tr><td style="padding:6px 0;color:${C.muted};width:40%">${e(label)}</td><td style="padding:6px 0;font-weight:bold">${e(value)}</td></tr>`;

function appointmentTable(a) {
  return `<table role="presentation" width="100%" style="border-collapse:collapse;margin:12px 0">
${row('Confirmation #', a.confirmationCode)}
${row('Service', a.serviceName)}
${row('Date', formatDateLong(a.date))}
${row('Time', `${formatMinutes(a.startMinutes)} – ${formatMinutes(a.endMinutes)}`)}
${row('Estimated duration', formatDuration(a.durationMinutes))}
${row('Starting price', formatMoney(a.priceCents))}
</table>`;
}

const STATUS_COPY = {
  pending: 'We have received your appointment request. Our team will review it and confirm shortly.',
  confirmed: 'Great news — your appointment is confirmed! We look forward to seeing you.',
  completed: 'Thank you for visiting Cece African Hair Braiding. We hope you love your new look!',
  cancelled: 'Your appointment has been cancelled.',
  no_show: 'We missed you at your appointment. Please contact us if you would like to rebook.',
};

export function appointmentEmail(a, { manageUrl, headline } = {}) {
  const title = headline || (a.status === 'confirmed' ? 'Your appointment is confirmed' : 'Appointment request received');
  const policy = `You can cancel or reschedule online up to ${BOOKING_POLICY.cancellationWindowHours} hours before your appointment.`;
  const html = layout(
    title,
    `<h1 style="font-family:Georgia,serif;font-weight:normal;color:${C.brown};margin:0 0 12px">${e(title)}</h1>
<p>Hi ${e(a.customer.name)},</p><p>${e(STATUS_COPY[a.status] || '')}</p>
${appointmentTable(a)}
${a.notes ? `<p style="color:${C.muted}"><strong>Your notes:</strong> ${e(a.notes)}</p>` : ''}
${manageUrl && ['pending', 'confirmed'].includes(a.status) ? button(manageUrl, 'Manage my appointment') + `<p style="font-size:13px;color:${C.muted}">${e(policy)}</p>` : ''}
<p style="font-size:13px;color:${C.muted}">Please arrive with hair detangled and free of product unless your stylist advised otherwise. Braiding hair is included unless stated in your service.</p>`
  );
  const text = `${title}\n\nHi ${a.customer.name},\n${STATUS_COPY[a.status] || ''}\n\nConfirmation #: ${a.confirmationCode}\nService: ${a.serviceName}\nDate: ${formatDateLong(a.date)}\nTime: ${formatMinutes(a.startMinutes)}\nStarting price: ${formatMoney(a.priceCents)}\n${manageUrl ? `\nManage your appointment: ${manageUrl}\n${policy}` : ''}`;
  return { subject: `${title} — ${a.confirmationCode}`, html, text };
}

export function ownerNewAppointmentEmail(a) {
  const html = layout(
    'New appointment request',
    `<h2 style="margin-top:0">New appointment request</h2>${appointmentTable(a)}
<p><strong>Client:</strong> ${e(a.customer.name)} · ${e(a.customer.email)} · ${e(a.customer.phone)}</p>
${a.notes ? `<p><strong>Notes:</strong> ${e(a.notes)}</p>` : ''}
${button(`${env.clientUrl}/admin/appointments`, 'Review in dashboard')}`
  );
  return {
    subject: `New booking: ${a.serviceName} on ${a.date} at ${formatMinutes(a.startMinutes)}`,
    html,
    text: `New appointment request ${a.confirmationCode} from ${a.customer.name} (${a.customer.email}).`,
  };
}

function orderItemsTable(order) {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line}">${e(i.name)} <span style="color:${C.muted}">× ${i.quantity}</span></td>
<td style="padding:8px 0;border-bottom:1px solid ${C.line};text-align:right">${formatMoney(i.priceCents * i.quantity, order.currency)}</td></tr>`
    )
    .join('');
  const line = (l, v, bold) =>
    `<tr><td style="padding:4px 0;${bold ? 'font-weight:bold' : `color:${C.muted}`}">${l}</td><td style="padding:4px 0;text-align:right;${bold ? 'font-weight:bold' : ''}">${v}</td></tr>`;
  return `<table role="presentation" width="100%" style="border-collapse:collapse;margin:12px 0">${rows}
${line('Subtotal', formatMoney(order.subtotalCents, order.currency))}
${line('Shipping', order.shippingCents ? formatMoney(order.shippingCents, order.currency) : 'Free')}
${line('Tax', formatMoney(order.taxCents, order.currency))}
${line('Total', formatMoney(order.totalCents, order.currency), true)}</table>`;
}

export function orderConfirmationEmail(order) {
  const a = order.shippingAddress;
  const html = layout(
    'Order confirmed',
    `<h1 style="font-family:Georgia,serif;font-weight:normal;color:${C.brown};margin:0 0 12px">Thank you for your order!</h1>
<p>Hi ${e(order.customer.firstName)}, your payment was successful and order <strong>${e(order.orderNumber)}</strong> is being prepared.</p>
${orderItemsTable(order)}
<p><strong>Shipping to:</strong><br>${e(order.customer.firstName)} ${e(order.customer.lastName)}<br>${e(a.line1)}${a.line2 ? `, ${e(a.line2)}` : ''}<br>${e(a.city)}, ${e(a.state)} ${e(a.postalCode)}<br>${e(a.country)}</p>
${button(`${env.clientUrl}/account/orders`, 'Track your order')}
<p style="font-size:13px;color:${C.muted}">Questions? Reply to this email or call ${e(BUSINESS.phone)}.</p>`
  );
  const text = `Thank you for your order ${order.orderNumber}!\n\n${order.items
    .map((i) => `${i.name} x${i.quantity} — ${formatMoney(i.priceCents * i.quantity)}`)
    .join('\n')}\n\nTotal: ${formatMoney(order.totalCents)}\n\nTrack your order: ${env.clientUrl}/account/orders`;
  return { subject: `Order confirmed — ${order.orderNumber}`, html, text };
}

const ORDER_STATUS_COPY = {
  processing: 'Your order is being prepared.',
  shipped: 'Your order is on its way!',
  delivered: 'Your order has been delivered. Enjoy!',
  cancelled: 'Your order has been cancelled. If you were charged, a refund will be issued to your original payment method.',
};

export function orderStatusEmail(order) {
  const tracking = order.trackingNumber
    ? `<p><strong>Tracking:</strong> ${e(order.carrier || '')} ${e(order.trackingNumber)}</p>`
    : '';
  const html = layout(
    'Order update',
    `<h2 style="margin-top:0;color:${C.brown}">Order ${e(order.orderNumber)} update</h2>
<p>${e(ORDER_STATUS_COPY[order.status] || `Status: ${order.status}`)}</p>${tracking}
${button(`${env.clientUrl}/account/orders`, 'View order')}`
  );
  return {
    subject: `Order ${order.orderNumber}: ${order.status.replace('_', ' ')}`,
    html,
    text: `${ORDER_STATUS_COPY[order.status] || order.status}${order.trackingNumber ? ` Tracking: ${order.carrier} ${order.trackingNumber}` : ''}`,
  };
}

export function ownerNewOrderEmail(order) {
  const html = layout(
    'New paid order',
    `<h2 style="margin-top:0">New paid order ${e(order.orderNumber)}</h2>
<p>${e(order.customer.firstName)} ${e(order.customer.lastName)} · ${e(order.customer.email)}</p>
${orderItemsTable(order)}
${order.stockIssue ? `<p style="color:#B00020"><strong>Stock warning:</strong> ${e(order.stockIssueDetail)}</p>` : ''}
${button(`${env.clientUrl}/admin/orders`, 'Open orders')}`
  );
  return { subject: `New order ${order.orderNumber} — ${formatMoney(order.totalCents)}`, html, text: `New order ${order.orderNumber}` };
}

export function passwordResetEmail(name, url) {
  const html = layout(
    'Reset your password',
    `<h2 style="margin-top:0;color:${C.brown}">Reset your password</h2><p>Hi ${e(name)},</p>
<p>We received a request to reset your password. This link expires in 1 hour.</p>${button(url, 'Choose a new password')}
<p style="font-size:13px;color:${C.muted}">If you didn't request this, you can safely ignore this email.</p>`
  );
  return { subject: 'Reset your Cece password', html, text: `Reset your password (expires in 1 hour): ${url}` };
}

export function welcomeEmail(name) {
  const html = layout(
    'Welcome',
    `<h2 style="margin-top:0;color:${C.brown}">Welcome to Cece, ${e(name)}!</h2>
<p>Your account is ready. Book appointments faster, track orders and manage your profile anytime.</p>
${button(`${env.clientUrl}/book`, 'Book an appointment')}`
  );
  return { subject: 'Welcome to Cece African Hair Braiding', html, text: `Welcome to Cece, ${name}!` };
}

export function contactNotificationEmail(msg) {
  const html = layout(
    'New contact message',
    `<h2 style="margin-top:0">New message from ${e(msg.name)}</h2>
<p>${e(msg.email)}${msg.phone ? ` · ${e(msg.phone)}` : ''}</p><p><strong>${e(msg.subject || 'No subject')}</strong></p>
<p style="white-space:pre-wrap">${e(msg.message)}</p>`
  );
  return { subject: `Website message: ${msg.subject || msg.name}`, html, text: msg.message };
}
