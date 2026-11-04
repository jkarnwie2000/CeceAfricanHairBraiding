import { Review, Product, Order } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/strings.js';

export async function listProductReviews(req, res) {
  const reviews = await Review.find({ product: req.params.id, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('-user')
    .lean();
  res.json({ reviews });
}

export async function createReview(req, res) {
  const product = await Product.findById(req.params.id).select('_id isActive');
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');
  if (await Review.exists({ product: product._id, user: req.user._id })) {
    throw ApiError.conflict('You have already reviewed this product.');
  }
  const verifiedPurchase = Boolean(
    await Order.exists({
      paymentStatus: 'paid',
      'items.product': product._id,
      $or: [{ user: req.user._id }, { 'customer.email': req.user.email }],
    })
  );
  const review = await Review.create({
    ...req.body,
    product: product._id,
    user: req.user._id,
    name: req.user.name,
    verifiedPurchase,
  });
  await Review.recalculateForProduct(product._id);
  res.status(201).json({ review });
}

export async function adminListReviews(req, res) {
  const { page, limit, q } = req.validatedQuery;
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
  const filter = rx ? { $or: [{ comment: rx }, { name: rx }, { title: rx }] } : {};
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('product', 'name slug images').lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
}

export async function setReviewApproval(req, res) {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: Boolean(req.body.isApproved) },
    { returnDocument: 'after' }
  );
  if (!review) throw ApiError.notFound('Review not found');
  await Review.recalculateForProduct(review.product);
  res.json({ review });
}

export async function deleteReview(req, res) {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  await Review.recalculateForProduct(review.product);
  res.json({ message: 'Review deleted' });
}
