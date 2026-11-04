import { Product } from '../models/index.js';
import { computeTotals } from '../utils/pricing.js';

/**
 * Re-price a cart using ONLY database values.
 * Client-submitted prices are never read — the browser sends product ids and quantities, nothing else.
 *
 * @param {{productId:string, quantity:number}[]} rawItems
 * @returns {Promise<{lines:Array, issues:Array, totals:object}>}
 */
export async function buildCart(rawItems) {
  // Merge duplicate lines for the same product
  const merged = new Map();
  for (const { productId, quantity } of rawItems) {
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = [];
  const issues = [];

  for (const [productId, requested] of merged) {
    const p = byId.get(productId);
    if (!p || !p.isActive) {
      issues.push({ productId, type: 'unavailable', message: 'This product is no longer available.' });
      continue;
    }
    if (requested <= 0) continue;
    if (p.inventory <= 0) {
      issues.push({ productId, name: p.name, type: 'out_of_stock', available: 0, message: `${p.name} is out of stock.` });
      continue;
    }
    let quantity = requested;
    if (requested > p.inventory) {
      issues.push({
        productId,
        name: p.name,
        type: 'insufficient_stock',
        requested,
        available: p.inventory,
        message: `Only ${p.inventory} of ${p.name} available.`,
      });
      quantity = p.inventory;
    }
    lines.push({
      productId,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] || '',
      priceCents: p.priceCents,
      quantity,
      inventory: p.inventory,
      lineTotalCents: p.priceCents * quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return { lines, issues, totals: computeTotals(subtotal) };
}
