require('dotenv').config()

module.exports.datastores = {
  default: {
    adapter: 'sails-postgresql',
    url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    wlNext: {
      caseSensitive: false
    }
  },
};
