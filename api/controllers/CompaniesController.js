module.exports = {
  index: async (req, res) => {
    const PER_PAGE = 3;

    let { page, limit, search } = req.query;
    page = page || 1;
    limit = limit || PER_PAGE;

    const skip = (page - 1) * PER_PAGE;

    // Generate search condition.
    const whereCondition = {};
    if (search) {
      // Hack around 'ilike'.
      whereCondition.or = [
        {
          name: {
            contains: search.toLowerCase(),
          },
        },
        {
          name: {
            contains: search.toUpperCase(),
          },
        },
      ];
    }

    const companies = await Company.find({
      where: whereCondition,
      limit,
      skip,
    })
      .populate('createdBy')
      .populate('updatedBy')
      .sort('id DESC');
    const count = await Company.count({ where: whereCondition });

    // Calculation for pagination object.
    const perPage = limit;
    const isEmpty = count > 0 ? true : false;
    const hasTotal = count ? true : false;
    const lastPage = Math.ceil(count / limit);
    const prevPage = +page > 1 ? +page - 1 : 1;
    const nextPage =
      +page < Math.ceil(count / limit) ? +page + 1 : Math.ceil(count / limit);
    const hasPages = count > PER_PAGE ? true : false;

    const firstPageUrl = search
      ? `/companies/search=${search}`
      : '/companies'
    const prevPageUrl = search
      ? `/companies?search=${search}&page=${prevPage}&limit=${perPage}`
      : `/companies?page=${prevPage}&limit=${perPage}`;
    const nextPageUrl = search
      ? `/companies?search=${search}&page=${nextPage}&limit=${perPage}`
      : `/companies?page=${nextPage}&limit=${perPage}`;
    const lastPageUrl = search
      ? `/companies?search=${search}&page=${lastPage}&limit=${perPage}`
      : `/companies?page=${lastPage}&limit=${perPage}`

    const pagination = {
      perPage: limit,
      currentPage: +page,
      firstPage: 1,
      isEmpty,
      total: count,
      hasTotal,
      lastPage,
      hasMorePages: true,
      prevPage,
      nextPage,
      hasPages,
      firstPageUrl,
      prevPageUrl,
      nextPageUrl,
      lastPageUrl
    };

    res.view('companies/index', {
      companies,
      pagination,
      req: { search: search || '' },
    });
  },

  show: async (req, res) => {
    const id = req.params.id;

    const company = await Company.findOne({ id }).populate('companyStatusId');

    console.log(company)

    return res.view('companies/show', { company });
  },

  new: async (req, res) => {
    // Fetch company status.
    const companyStatuses = await CompanyStatus.find({ where: { isActive: true } })

    return res.view('companies/new', { companyStatuses });
  },

  create: async (req, res) => {
    const { name, website, companyStatusId } = req.body;

    const company = await Company.create({
      name,
      website,
      createdBy: req.me.id,
      companyStatusId
    }).fetch();

    res.redirect(`/companies/${company.id}`);
  },

  edit: async (req, res) => {
    const id = req.params.id;

    // Fetch company status.
    const companyStatuses = await CompanyStatus.find({ where: { isActive: true } })
    const company = await Company.findOne({ id });

    return res.view('companies/edit', { company, companyStatuses });
  },

  update: async (req, res) => {
    const id = req.params.id;
    const { name, website, companyStatusId } = req.body;

    const company = await Company.updateOne({ id }).set({
      name,
      website,
      updatedBy: req.me.id,
      companyStatusId
    });

    res.redirect(`/companies/${company.id}`);
  },

  destroy: async (req, res) => {
    const id = req.params.id;

    await Company.destroyOne({ id });

    res.redirect('/companies');
  },
};
