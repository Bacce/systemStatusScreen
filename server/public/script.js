
function updateScreen() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/status', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    var timeStr = data.time;
                    if (timeStr.split(':').length > 2) {
                        timeStr = timeStr.substring(0, 5);
                    }
                    document.getElementById("time").innerHTML = timeStr;
                    document.getElementById("stat-ip").innerHTML = data.ip;
                    document.getElementById("stat-pve-ip").innerHTML = data.pveIp || "...";
                    document.getElementById("stat-cpu").innerHTML = data.cpu;
                    document.getElementById("stat-ram").innerHTML = data.ram;
                    document.getElementById("stat-disk").innerHTML = data.disk;
                    document.getElementById("stat-temp").innerHTML = data.weather.temperature;
                    document.getElementById("stat-cond").innerHTML = data.weather.condition;
                    document.getElementById("stat-pve-cpu").innerHTML = data.pveCpu || "...";
                    document.getElementById("stat-pve-ram").innerHTML = data.pveRam || "...";
                    document.getElementById("error-message").style.display = "none";

                    if (data.pveCpuPercent !== undefined) {
                        document.getElementById("bar-pve-cpu").style.width = data.pveCpuPercent + "%";
                    }

                    if (data.pveRamPercent !== undefined) {
                        document.getElementById("bar-pve-ram").style.width = data.pveRamPercent + "%";
                    }

                    if (data.pveDiskPercent !== undefined) {
                        document.getElementById("bar-pve-disk").style.width = data.pveDiskPercent + "%";
                    }
                    document.getElementById("stat-pve-disk").innerHTML = data.pveDisk || "...";


                    if (data.cpuPercent !== undefined) {
                        document.getElementById("bar-cpu").style.width = data.cpuPercent + "%";
                    }

                    if (data.ramPercent !== undefined) {
                        document.getElementById("bar-ram").style.width = data.ramPercent + "%";
                    }

                    if (data.diskPercent !== undefined) {
                        document.getElementById("bar-disk").style.width = data.diskPercent + "%";
                    }

                    setTimeout(updateScreen, data.updateInterval || 60000);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    document.getElementById("error-message").style.display = "block";
                    setTimeout(updateScreen, 60000);
                }
            } else {
                document.getElementById("error-message").style.display = "block";
                setTimeout(updateScreen, 60000);
            }
        }
    };
    xhr.onerror = function () {
        document.getElementById("error-message").style.display = "block";
        setTimeout(updateScreen, 60000);
    };
    xhr.send();
}

updateScreen();
