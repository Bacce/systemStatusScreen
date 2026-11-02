#!/usr/bin/env node
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const si = require('systeminformation');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

let weatherCache = {
    data: null,
    lastUpdate: 0
};
let statusCache = {
    data: null,
    lastUpdate: 0
};


async function getWeather() {
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    if (weatherCache.data && (now - weatherCache.lastUpdate < CACHE_DURATION)) {
        return weatherCache.data;
    }

    try {
        const lat = process.env.WEATHER_LAT || '47.690769'; // Default Göd
        const lon = process.env.WEATHER_LON || '19.134569';
        const weatherLink = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        
        const response = await fetch(weatherLink);
        if (!response.ok) {
            throw new Error(`Weather API responded with status: ${response.status}`);
        }

        const json = await response.json();
        const current = json.current;

        if (!current) {
            throw new Error('Weather API response missing "current" data');
        }

        const temp = current.temperature_2m !== null ? `${Math.round(current.temperature_2m)}°C` : '--';
        const code = current.weather_code;

        const conditionMap = {
            0: 'Sunny',
            1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Depositing Rime Fog',
            51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
            61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
            71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
            80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
            95: 'Slight Thunderstorm', 96: 'Moderate Thunderstorm', 99: 'Heavy Thunderstorm'
        };

        const condition = conditionMap[code] || 'Unknown';

        weatherCache = {
            data: { temperature: temp, condition },
            lastUpdate: now
        };

        return weatherCache.data;
    } catch (error) {
        console.error("Error fetching weather:", error.message);
        
        if (weatherCache.data) {
            return weatherCache.data;
        }

        return { 
            temperature: process.env.WEATHER_FALLBACK_TEMP || '--', 
            condition: process.env.WEATHER_FALLBACK_COND || 'Unavailable' 
        };
    }
}

function formatProxmoxStats(input) {
    const node = Array.isArray(input.data) ? input.data[0] : input;

    if (!node) {
        throw new Error("No Proxmox node data provided");
    }

    const toGB = (bytes) => {
        return Number((bytes / (1024 ** 3)).toFixed(2));
    };

    const toPercentage = (used, total) => {
        if (!total) return 0;
        return Number(((used / total) * 100).toFixed(2));
    };

    return {
        node: node.node,
        storage: {
            total: toGB(node.maxdisk),
            used: toGB(node.disk),
            free: toGB(node.maxdisk - node.disk),
            usagePercentage: toPercentage(node.disk, node.maxdisk)
        },
        cpu: {
            cores: node.maxcpu,
            usagePercentage: Number((node.cpu * 100).toFixed(2))
        },
        memory: {
            total: toGB(node.maxmem),
            used: toGB(node.mem),
            free: toGB(node.maxmem - node.mem),
            usagePercentage: toPercentage(node.mem, node.maxmem)
        },
        uptime: node.uptime,
        status: node.status
    };
}

async function getProxmoxStatus() {
    const PROXMOX_URL = 'https://192.168.68.55:8006/api2/json/nodes';
    const PROXMOX_HOST = new URL(PROXMOX_URL).host;
    const PROXMOX_TOKEN = process.env.PROXMOX_TOKEN;

    if (!PROXMOX_TOKEN) {
        console.warn("PROXMOX_TOKEN not set, skipping Proxmox stats");
        return { cpu: 'N/A', ram: 'N/A', disk: 'N/A', cpuPercent: 0, ramPercent: 0, diskPercent: 0, ip: PROXMOX_HOST };
    }

    try {
        const response = await fetch(PROXMOX_URL, {
            headers: {
                'Authorization': `PVEAPIToken=${PROXMOX_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Proxmox API error: ${response.status}`);
        }

        const json = await response.json();
        const stats = formatProxmoxStats(json);
        console.log(stats);

        return {
            cpu: `${stats.cpu.usagePercentage}%`,
            cpuPercent: stats.cpu.usagePercentage,
            ram: `${stats.memory.used} GB / ${stats.memory.total} GB`,
            ramPercent: stats.memory.usagePercentage,
            disk: `${stats.storage.used} GB / ${stats.storage.total} GB`,
            diskPercent: stats.storage.usagePercentage,
            ip: PROXMOX_HOST
        };
    } catch (error) {
        console.error("Error fetching Proxmox status:", error);
        return { cpu: 'Error', ram: 'Error', disk: 'Error', cpuPercent: 0, ramPercent: 0, diskPercent: 0, ip: PROXMOX_HOST };
    }
}

async function getStatus() {
    const DAY_INTERVAL = 60000;
    const NIGHT_INTERVAL = 1800000;

    const now = Date.now();
    const hour = new Date().getHours();
    const currentInterval = (hour >= 22 || hour < 6) ? NIGHT_INTERVAL : DAY_INTERVAL;

    if (statusCache.data && (now - statusCache.lastUpdate < currentInterval)) {
        return statusCache.data;
    }

    try {
        const timeData = await si.time();
        const date = new Date(timeData.current);
        const updateInterval = currentInterval;

        const network = await si.networkInterfaces();
        const ip = network.find(iface => iface.ip4 && iface.ip4 !== '127.0.0.1')?.ip4 || '0.0.0.0';

        const load = await si.currentLoad();
        const cpu = `${Math.round(load.currentLoad)}%`;

        const mem = await si.mem();
        const ramPercent = Math.round((mem.used / mem.total) * 100);
        const ram = `${(mem.used / 1024 ** 3).toFixed(1)} GB / ${(mem.total / 1024 ** 3).toFixed(1)} GB`;
        const fs = await si.fsSize();
        const diskData = fs[0];
        const diskPercent = Math.round((diskData.used / diskData.size) * 100);
        const disk = `${(diskData.used / 1024 ** 3).toFixed(0)}GB / ${(diskData.size / 1024 ** 3).toFixed(0)}GB`;

        const uptimeSeconds = timeData.uptime;
        const days = Math.floor(uptimeSeconds / (24 * 3600));
        const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptime = `${days}d ${hours}h ${minutes}m`;

        const weather = await getWeather();
        const pve = await getProxmoxStatus();
        const status = {
            time: date.toLocaleTimeString('en-GB'),
            ip,
            cpu,
            cpuPercent: parseInt(cpu),
            ram,
            ramPercent,
            disk,
            diskPercent,
            uptime,
            weather,
            updateInterval,
            pveIp: pve.ip,
            pveCpu: pve.cpu,
            pveCpuPercent: pve.cpuPercent,
            pveRam: pve.ram,
            pveRamPercent: pve.ramPercent,
            pveDisk: pve.disk,
            pveDiskPercent: pve.diskPercent,
        };

        statusCache = {
            data: status,
            lastUpdate: now
        };
        return status;
    } catch (error) {
        console.error("Error fetching system status:", error);
        return {
            time: new Date().toLocaleTimeString('en-GB'),
            ip: 'Error',
            cpu: 'Error',
            ram: 'Error',
            disk: 'Error',
            pveCpu: 'Error',
            pveRam: 'Error',
            pveDisk: 'Error',
            uptime: 'Error',
            weather: { temperature: 'Error', condition: 'Error' },
            updateInterval: DAY_INTERVAL
        };
    }
}

app.get('/api/status', async (req, res) => {
    const status = await getStatus();
    res.json(status);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
const fs = require('fs');

app.get('/api/random-image', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    fs.readdir(imagesDir, (err, files) => {
        if (err || !files || files.length === 0) {
            return res.status(404).send('No images found');
        }
        const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        if (images.length === 0) {
            return res.status(404).send('No images found');
        }
        const randomImage = images[Math.floor(Math.random() * images.length)];
        res.json({ filename: randomImage });
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
