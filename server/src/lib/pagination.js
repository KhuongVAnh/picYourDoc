function parsePagination(query, options = {}) {
  const defaultPage = options.defaultPage || 1;
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 50;

  const page = Math.max(defaultPage, Number(query.page) || defaultPage);
  const rawLimit = Number(query.limit) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildMeta };
