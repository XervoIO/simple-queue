var Configs = {};

// PRODUCTION
Configs.production = {
  name: 'production',
  auth: { username: 'guest', password: 'guest' },
  auth_enabled: true,
  port: 8989
};

// STAGING
Configs.staging = {
  name: 'staging',
  auth: { username: 'guest', password: 'guest' },
  auth_enabled: true,
  port: 8989
};

module.exports = Configs;