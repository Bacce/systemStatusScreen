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
                    document.getElementById("stat-cpu").innerHTML = data.cpu;
                    document.getElementById("stat-ram").innerHTML = data.ram;
                    document.getElementById("stat-disk").innerHTML = data.disk;
                    document.getElementById("stat-temp").innerHTML = data.weather.temperature;
                    document.getElementById("stat-cond").innerHTML = data.weather.condition;
                    document.getElementById("error-message").style.display = "none";

                    var cpuVal = parseInt(data.cpu);
                    if (!isNaN(cpuVal)) {
                        document.getElementById("bar-cpu").style.width = cpuVal + "%";
                    }

                    var ramParts = data.ram.split(' / ');
                    if (ramParts.length === 2) {
                        var ramUsed = parseFloat(ramParts[0]);
                        var ramTotal = parseFloat(ramParts[1]);
                        if (!isNaN(ramUsed) && !isNaN(ramTotal)) {
                            document.getElementById("bar-ram").style.width = (ramUsed / ramTotal * 100) + "%";
                        }
                    }

                    var diskParts = data.disk.split(' / ');
                    if (diskParts.length === 2) {
                        var diskUsed = parseFloat(diskParts[0]);
                        var diskTotal = parseFloat(diskParts[1]);
                        if (!isNaN(diskUsed) && !isNaN(diskTotal)) {
                            document.getElementById("bar-disk").style.width = (diskUsed / diskTotal * 100) + "%";
                        }
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
