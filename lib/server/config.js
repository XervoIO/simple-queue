var Configs = {};

// PRODUCTION
Configs.production = {
  name: 'production',
  auth: { username: 'guest', password: 'guest' },
  auth_enabled: true,
  port: 8989,
  max_history: 1000,
  message_log: './messages.log',
  message_logging_enabled: false
};

// STAGING
Configs.staging = {
  name: 'staging',
  auth: { username: 'guest', password: 'guest' },
  auth_enabled: true,
  port: 8989,
  max_history: 1000,
  message_log: './messages.log',
  message_logging_enabled: false
};

module.exports = Configs;