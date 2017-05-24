var express = require('express');
var request = require('request');
var app = express();
app.use(express.static('public'))
var path = require('path');
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.get('/getMaps', function (req, res) {
  var options = {
    url : 'https://pwc.downstreamlabs.com/api/map',
    headers : {
      Authorization : "Bearer ff779ee219d7be0549c971d6ba2311d5"
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    }
  });
});

app.get('/getMapsNearby', function (req, res) {
  var options = {
    url : 'https://pwc.downstreamlabs.com/api/map/nearby',
    headers : {
      Authorization : "Bearer ff779ee219d7be0549c971d6ba2311d5"
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    }
  });
});

app.options('/getMaps', function (req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

app.get('/main', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!!!!')
})
