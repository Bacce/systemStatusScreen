#!/usr/bin/env node

const si = require('systeminformation');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

async function getStatus() {
    const DAY_INTERVAL = 60000;
    const NIGHT_INTERVAL = 300000;

    try {
        const timeData = await si.time();
        const date = new Date(timeData.current);
        const hour = date.getHours();
        const updateInterval = (hour >= 22 || hour < 6) ? NIGHT_INTERVAL : DAY_INTERVAL;

        const network = await si.networkInterfaces();
        const ip = network.find(iface => iface.ip4 && iface.ip4 !== '127.0.0.1')?.ip4 || '0.0.0.0';

        const load = await si.currentLoad();
        const cpu = `${Math.round(load.currentLoad)}%`;

        const mem = await si.mem();
        const ram = `${(mem.used / 1024 ** 3).toFixed(1)} GB / ${(mem.total / 1024 ** 3).toFixed(1)} GB`;

        const fs = await si.fsSize();
        const diskData = fs[0];
        const disk = `${(diskData.used / 1024 ** 3).toFixed(0)}GB / ${(diskData.size / 1024 ** 3).toFixed(0)}GB`;

        const uptimeSeconds = timeData.uptime;
        const days = Math.floor(uptimeSeconds / (24 * 3600));
        const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptime = `${days}d ${hours}h ${minutes}m`;

        return {
            time: date.toLocaleTimeString('en-GB'),
            ip,
            cpu,
            ram,
            disk,
            uptime,
            updateInterval
        };
    } catch (error) {
        console.error("Error fetching system status:", error);
        return {
            time: new Date().toLocaleTimeString('en-GB'),
            ip: 'Error',
            cpu: 'Error',
            ram: 'Error',
            disk: 'Error',
            uptime: 'Error',
            updateInterval: DAY_INTERVAL
        };
    }
}

app.get('/api/status', async (req, res) => {
    const status = await getStatus();
    res.json(status);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
