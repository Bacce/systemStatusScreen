#!/usr/bin/env node

var exec = require('child_process').exec;
var http = require('http');
const fs = require("fs");
const path = require("path");

function execute(command, callback) {
  exec(command, function(error, stdout, stderr){ console.log(error?error:"", stdout?stdout:"", stderr?stderr:""); callback(stderr); });
}

http.createServer(function (req, res) {
  if (req.url === "/") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
        execute('/sbin/shutdown now', function(callback) {});
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
	console.log("shutdown server initialized");
}).listen(12345);
