import { Service } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/strings.js';

const toDoc = (body) => {
  const doc = { ...body };
  if (body.price !== undefined) doc.priceCents = Math.round(body.price * 100);
  delete doc.price;
  return doc;
};

export async function listServices(req, res) {
  const showAll = req.user?.role === 'admin' && req.query.all === 'true';
  const services = await Service.find(showAll ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ services });
}

export async function getService(req, res) {
  const service = await Service.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!service) throw ApiError.notFound('Service not found');
  res.json({ service });
}

export async function createService(req, res) {
  const service = await Service.create({ ...toDoc(req.body), slug: await uniqueSlug(Service, req.body.name) });
  res.status(201).json({ service });
}

export async function updateService(req, res) {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  const doc = toDoc(req.body);
  if (doc.name && doc.name !== service.name) doc.slug = await uniqueSlug(Service, doc.name, service._id);
  service.set(doc);
  await service.save();
  res.json({ service });
}

export async function deleteService(req, res) {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  res.json({ message: 'Service deleted. Existing appointments keep their service details.' });
}
