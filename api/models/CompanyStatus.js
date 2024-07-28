module.exports = {
  tableName: 'companyStatuses',

  attributes: {
    name: {
      type: 'string',
      required: true,
      maxLength: 255,
    },
    isActive: {
      type: 'boolean',
      defaultsTo: true,
    },

    updatedBy: {
      model: 'user',
    },
    companies: {
      collection: 'company',
      via: 'companyStatusId',
    },
  },
};
