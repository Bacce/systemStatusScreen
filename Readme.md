# System Status Screen

I had this arduino display laying on my desk for a while now, so I decided to make it useful and turn it into a display to show my home lab servers status, ip address, temp, etc.

Article about it on medium (Hungarian)

https://medium.com/@makosbab/szerver-kijelz%C5%91vel-h%C3%A1zilag-db08db5424c3

It is fairly simple, the display shows whatever it receives through serial, and the server checks every 60s whats up and sends it to the display.

folders:

₋ display: The arduino code. I'm using an arduino Mega and a 240x320px color lcd. I'm using the UTTF library, I also added the lib as a zip here just in case it disappear from the internet.

- server: NodeJs server taking system information and sending it to the hardcoded serial port as a string.
