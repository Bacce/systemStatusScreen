Run it as a service on linux server

https://stackoverflow.com/questions/4018154/how-do-i-run-a-node-js-app-as-a-background-service

- make index.js executable (chmod +X index.js), and have the first line as follows:
- #!/usr/bin/env node
- test by running $ ./index.js
- If no access to the serial port by the app, it will give you permission $ sudo chmod 666 /dev/ttyACM0
- copy .service file to /etc/systemd/system folder.
- update the user and group to be "root", at least on ubuntu: $ chown root:root index.js
- update service files "execStart" to the index.js folder
- update service files "working directory" path to the path to index.js
- start it with $ systemctl start ##service##
- enable it for automatic start $ systemctl enable ##service##
- see logs with $ journalctl -u ##service##