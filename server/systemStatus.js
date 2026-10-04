const si = require('systeminformation');

const padTo2Digits = (num) => num.toString().padStart(2, '0');

async function getStatus() {
    try {
        const timeData = await si.time();
        const date = new Date(timeData.current);
        
        const network = await si.networkInterfaces();
        const ip = network.find(iface => iface.ip4 && iface.ip4 !== '127.0.0.1')?.ip4 || '0.0.0.0';
        
        const load = await si.currentLoad();
        const cpu = `${Math.round(load.currentLoad)}%`;
        
        const mem = await si.mem();
        const ram = `${(mem.used / 1024**3).toFixed(1)} GB / ${(mem.total / 1024**3).toFixed(1)} GB`;
        
        const fs = await si.fsSize();
        const diskData = fs[0];
        const disk = `${(diskData.used / 1024**3).toFixed(0)}GB / ${(diskData.size / 1024**3).toFixed(0)}GB`;
        
        const uptimeSeconds = timeData.uptime;
        const days = Math.floor(uptimeSeconds / (24 * 3600));
        const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptime = `${days}d ${hours}h ${minutes}m`;
        
        return {
            time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0'),
            ip,
            cpu,
            ram,
            disk,
            uptime
        };
    } catch (error) {
        console.error("Error fetching system status:", error);
        return {
            time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
            ip: 'Error',
            cpu: 'Error',
            ram: 'Error',
            disk: 'Error',
            uptime: 'Error'
        };
    }
}

module.exports = { getStatus };
