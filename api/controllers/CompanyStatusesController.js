module.exports = {
  index: async (req, res) => {
    // Search and pagination are not present in admin fields.
    const companyStatuses = await CompanyStatus.find().populate('updatedBy');
    const count = await CompanyStatus.count();

    res.view('admin/company-statuses/index', {
      companyStatuses,
      count,
    });
  },

  show: async (req, res) => {
    const id = req.params.id;

    const companyStatus = await CompanyStatus.findOne({ id });

    return res.view('admin/company-statuses/show', { companyStatus });
  },

  new: async (req, res) => {
    return res.view('admin/company-statuses/new');
  },

  create: async (req, res) => {
    const { name, isActive } = req.body;

    const companyStatus = await CompanyStatus.create({
      name,
      isActive: isActive === 'on' ? true : false,
      createdBy: req.me.id,
    }).fetch();

    res.redirect(`/admin/company-statuses/${companyStatus.id}`);
  },

  edit: async (req, res) => {
    const id = req.params.id;

    const companyStatus = await CompanyStatus.findOne({ id });

    return res.view('admin/company-statuses/edit', { companyStatus });
  },

  update: async (req, res) => {
    const id = req.params.id;
    const { name, isActive } = req.body;

    const companyStatus = await CompanyStatus.updateOne({ id }).set({
      name,
      isActive: isActive === 'on' ? true : false,
      updatedBy: req.me.id,
    });

    res.redirect(`/admin/company-statuses/${companyStatus.id}`);
  },

  destroy: async (req, res) => {
    const id = req.params.id;

    await CompanyStatus.destroyOne({ id });

    res.redirect('/admin/company-statuses');
  },
};
