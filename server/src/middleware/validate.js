import { ApiError } from '../utils/ApiError.js';

/**
 * Validate a request part with a zod schema.
 * - body:   replaced with the parsed (coerced + stripped) value
 * - query:  parsed value stored on req.validatedQuery (Express 5's req.query is read-only)
 * - params: parsed value stored on req.validatedParams
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw ApiError.badRequest(details[0]?.message ? `${details[0].field ? `${details[0].field}: ` : ''}${details[0].message}` : 'Invalid request', details);
    }
    if (source === 'body') req.body = result.data;
    else if (source === 'query') req.validatedQuery = result.data;
    else req.validatedParams = result.data;
    next();
  };
}
