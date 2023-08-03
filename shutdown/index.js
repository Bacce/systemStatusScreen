#!/usr/bin/env node

var exec = require('child_process').exec;
var http = require('http');

function execute(command, callback) {
  exec(command, function(error, stdout, stderr){ console.log(error?error:"", stdout?stdout:"", stderr?stderr:""); callback(stderr); });
}

http.createServer(function (req, res) {
  if(req) {
    execute('/sbin/shutdown now', function(callback) {
      res.write("bye.");
      res.end();
    });
  }
	console.log("shutdown server initialized");
}).listen(12345);
