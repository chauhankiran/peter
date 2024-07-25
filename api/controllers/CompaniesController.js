module.exports = {
  index: async (req, res) => {
    const companies = await Company.find();

    res.view('companies/index', { companies });
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
      website
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

    const company = await Company
      .updateOne({ id })
      .set({ name, website });

    res.redirect(`/companies/${company.id}`);
  },

  destroy: async (req, res) => {
    const id = req.params.id;

    await Company
      .destroyOne({ id })

    res.redirect('/companies')
  },
}