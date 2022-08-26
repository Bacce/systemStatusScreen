Run it as a service on linux server

https://stackoverflow.com/questions/4018154/how-do-i-run-a-node-js-app-as-a-background-service

- make index.js executable, and have the first line as in there
- copy .service file to /etc/systemd/system folder.
- start it with systemctl start ##service##
- enable it for automatic start
- see logs with journalctl -u ##service##
