const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return next(new ApiError(400, 'Validation failed', details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
