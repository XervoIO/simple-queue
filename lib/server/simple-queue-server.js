var configs = require('./config'),
    util = require('util'),
    fs = require('fs'),
    tracer = require('tracer').console();

// Load the configuration based on the NODE_ENV environment variable.
if(process.env.NODE_ENV === 'production') {
  process.config = configs.production;
}
else {
  process.config = configs.staging;
}

tracer.log('Loaded configuration: ' + process.config.name);

var express = require('express'),
        app = express();

// Global counter for message ids.
var id = 0;

// All messages currently pending.
var messages = {};

// All messages that have ever been received.
var messageHistory = [];

//--------------------------------------------------------------------------------------------------
if(process.config.auth_enabled) {
  app.use(express.basicAuth(process.config.auth.username, process.config.auth.password));
}

//--------------------------------------------------------------------------------------------------
app.use(express.bodyParser({
  keepExtensions: true
}));

//--------------------------------------------------------------------------------------------------
app.use(function(req, res, next) {
  res.contentType('application/json');
  next();
});

/**
 * Adds a message to the message history.
 * @param message The message to add.
 */
//--------------------------------------------------------------------------------------------------
var addToHistory = function(message) {

  // If the history is too large, remove the old ones.
  while(messageHistory.length >= process.config.max_history) {
    messageHistory.shift();
  }

  messageHistory.push(message);

  // Write the message to the log.
  if(process.config.message_logging_enabled) {
    fs.appendFileSync(process.config.message_log, util.inspect(message, false, 4) + '\r\n\r\n');
  }
};

//--------------------------------------------------------------------------------------------------
app.get('/', function(req, res) {
  res.contentType('text/plain');
  res.send(util.inspect(messageHistory, false, 6));
});

//--------------------------------------------------------------------------------------------------
app.post('/enqueue/:queue', function(req, res) {
  var queueName = req.params.queue;
  if(!messages[queueName]) {
    messages[queueName] = [];
  }

  var message = {
    queue: queueName,
    id: id,
    datetime: new Date().toUTCString(),
    data: req.body
  };

  messages[queueName].push(message);

  addToHistory(message);

  res.send({
    result: 'success',
    queue: queueName,
    id: id
  });

  id++;
});

//--------------------------------------------------------------------------------------------------
app.get('/dequeue/:queue', function(req, res) {
  var queueName = req.params.queue;
  if(messages[queueName] && messages[queueName].length > 0) {
    var message = messages[queueName].shift();
    message.completed = true;
    res.send(message);
  }
  else {
    res.send(204);
  }
});

var port = process.env.PORT || process.config.port;
app.listen(port);
tracer.log('simple-queue started on port ' + port);