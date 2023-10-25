# System Status Screen

I had this arduino display laying on my desk for a while now, so I decided to make it useful and turn it into a display to show my home lab servers status, ip address, temp, etc.

It is fairly simple, the display shows whatever it receives through serial, and the server is checks every 10s whats up and sends it to the display.

folders:

₋ display: The arduino code. I'm using an arduino Mega and a 240x320px color lcd. I'm using the UTTF library, I also added the lib as a zip here just in case it disappear from the internet.

- server: NodeJs server taking system information and sending it to the hardcoded serial port as a string.

- shutdown: simple node server what will shutdown the system if called

- landing: plex status, link to plex and shutdown link, landing page for the homelab