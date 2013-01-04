var configs = require('./config'),
  tracer = require('tracer').console();

if(process.env['NODE_ENV'] === 'production') {
  process.config = configs.production;
}
else {
  process.config = configs.staging;
}

tracer.log('Loaded configuration: ' + process.config.name);

var express = require('express'),
        app = express();

var id = 0;
var messages = {};

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

//--------------------------------------------------------------------------------------------------
app.post('/enqueue/:queue', function(req, res) {
  var queueName = req.params.queue;
  if(!messages[queueName]) {
    messages[queueName] = [];
  }

  messages[queueName].push({
    queue: queueName,
    id: id,
    datetime: new Date().toUTCString(),
    data: req.body
  });

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
    res.send(message);
  }
  else {
    res.send(204);
  }
});

var port = process.env.PORT || process.config.port;
app.listen(port);
tracer.log('Queue started on port ' + port);