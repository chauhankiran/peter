module.exports = {
  tableName: 'companies',

  attributes: {
    name: {
      type: 'string',
      maxLength: 255,
    },
    website: {
      type: 'string',
      maxLength: 255,
    },
  },
};
