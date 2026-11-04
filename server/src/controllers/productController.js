import { Product, Category, Review } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, uniqueSlug } from '../utils/strings.js';

const SORTS = {
  featured: { featured: -1, soldCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { priceCents: 1 },
  'price-desc': { priceCents: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  'best-selling': { soldCount: -1 },
  name: { name: 1 },
};

const isAdmin = (req) => req.user?.role === 'admin';

export async function listProducts(req, res) {
  const { q, category, minPrice, maxPrice, sort, page, limit, featured, inStock, includeInactive } = req.validatedQuery;
  const filter = {};
  if (!(includeInactive === 'true' && isAdmin(req))) filter.isActive = true;

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { description: rx }, { tags: rx }];
  }
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (!cat) return res.json({ products: [], total: 0, page: 1, pages: 0 });
    filter.category = cat._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.priceCents = {};
    if (minPrice !== undefined) filter.priceCents.$gte = Math.round(minPrice * 100);
    if (maxPrice !== undefined) filter.priceCents.$lte = Math.round(maxPrice * 100);
  }
  if (featured === 'true') filter.featured = true;
  if (inStock === 'true') filter.inventory = { $gt: 0 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...SORTS[sort], _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ products, total, page, pages: Math.ceil(total / limit) });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug').lean();
  if (!product || (!product.isActive && !isAdmin(req))) throw ApiError.notFound('Product not found');
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true })
    .sort({ soldCount: -1 })
    .limit(4)
    .populate('category', 'name slug')
    .lean();
  res.json({ product, related });
}

function toProductDoc(body) {
  const doc = { ...body };
  if (body.price !== undefined) doc.priceCents = Math.round(body.price * 100);
  if (body.compareAtPrice !== undefined) {
    doc.compareAtPriceCents = body.compareAtPrice === '' || body.compareAtPrice === null ? null : Math.round(body.compareAtPrice * 100);
  }
  delete doc.price;
  delete doc.compareAtPrice;
  return doc;
}

async function assertCategory(id) {
  if (id && !(await Category.exists({ _id: id }))) throw ApiError.badRequest('Category not found');
}

export async function createProduct(req, res) {
  await assertCategory(req.body.category);
  const doc = toProductDoc(req.body);
  doc.slug = await uniqueSlug(Product, req.body.name);
  const product = await Product.create(doc);
  res.status(201).json({ product: await product.populate('category', 'name slug') });
}

export async function updateProduct(req, res) {
  await assertCategory(req.body.category);
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  const doc = toProductDoc(req.body);
  if (doc.name && doc.name !== product.name) doc.slug = await uniqueSlug(Product, doc.name, product._id);
  product.set(doc);
  await product.save();
  res.json({ product: await product.populate('category', 'name slug') });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await Review.deleteMany({ product: product._id });
  res.json({ message: 'Product deleted' });
}

export async function updateInventory(req, res) {
  const { inventory, adjust } = req.body;
  let product;
  if (inventory !== undefined) {
    product = await Product.findByIdAndUpdate(req.params.id, { inventory }, { returnDocument: 'after', runValidators: true });
  } else {
    product = await Product.findOneAndUpdate(
      { _id: req.params.id, inventory: { $gte: Math.max(0, -adjust) } },
      { $inc: { inventory: adjust } },
      { returnDocument: 'after' }
    );
    if (!product && (await Product.exists({ _id: req.params.id }))) throw ApiError.badRequest('Inventory cannot go below zero');
  }
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product });
}

export async function priceRange(_req, res) {
  const [r] = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: '$priceCents' }, max: { $max: '$priceCents' } } },
  ]);
  res.json({ minCents: r?.min || 0, maxCents: r?.max || 0 });
}
