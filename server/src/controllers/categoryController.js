import { Category, Product } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/strings.js';

export async function listCategories(_req, res) {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [c._id.toString(), c.count]));
  res.json({ categories: categories.map((c) => ({ ...c, productCount: byId.get(c._id.toString()) || 0 })) });
}

export async function createCategory(req, res) {
  const slug = await uniqueSlug(Category, req.body.name);
  const category = await Category.create({ ...req.body, slug });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  if (req.body.name && req.body.name !== category.name) category.slug = await uniqueSlug(Category, req.body.name, category._id);
  category.set(req.body);
  await category.save();
  res.json({ category });
}

export async function deleteCategory(req, res) {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse) throw ApiError.conflict(`This category still has ${inUse} product(s). Move or delete them first.`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ message: 'Category deleted' });
}
