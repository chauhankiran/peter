module.exports = {
  index: async (req, res) => {
    const PER_PAGE = 3;

    let { page, limit } = req.query;
    page = page || 1;
    limit = limit || PER_PAGE;

    const skip = (page - 1) * PER_PAGE;

    const companies = await Company.find({ limit, skip })
      .populate('createdBy')
      .populate('updatedBy')
      .sort('id DESC');
    const count = await Company.count();

    // Pagination object.
    const pagination = {
      perPage: limit,
      currentPage: +page,
      firstPage: 1,
      isEmpty: count > 0 ? true : false,
      total: count,
      hasTotal: count ? true : false,
      lastPage: Math.ceil(count / limit),
      hasMorePages: true,
      prevPage: +page > 1 ? +page - 1 : 1,
      nextPage:
        +page < Math.ceil(count / limit) ? +page + 1 : Math.ceil(count / limit),
      hasPages: count > PER_PAGE ? true : false,
    };

    res.view('companies/index', { companies, pagination });
  },

  show: async (req, res) => {
    const id = req.params.id;

    const company = await Company.findOne({ id });

    res.view('companies/show', { company });
  },

  new: async (req, res) => {
    res.view('companies/new');
  },

  create: async (req, res) => {
    const { name, website } = req.body;

    const company = await Company.create({
      name,
      website,
      createdBy: req.me.id,
    }).fetch();

    res.redirect(`/companies/${company.id}`);
  },

  edit: async (req, res) => {
    const id = req.params.id;

    const company = await Company.findOne({ id });

    res.view('companies/edit', { company });
  },

  update: async (req, res) => {
    const id = req.params.id;
    const { name, website } = req.body;

    const company = await Company.updateOne({ id }).set({
      name,
      website,
      updatedBy: req.me.id,
    });

    res.redirect(`/companies/${company.id}`);
  },

  destroy: async (req, res) => {
    const id = req.params.id;

    await Company.destroyOne({ id });

    res.redirect('/companies');
  },
};
