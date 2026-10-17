#!/usr/bin/env node

const si = require('systeminformation');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

let weatherCache = {
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
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const json = await response.json();

        const current = json.current;
        const temp = `${Math.round(current.temperature_2m)}°C`;
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
        console.error("Error fetching weather:", error);
        return weatherCache.data || { temperature: 'N/A', condition: 'Error' };
    }
}

async function getStatus() {
    const DAY_INTERVAL = 60000;
    const NIGHT_INTERVAL = 1800000;

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

        const weather = await getWeather();
        return {
            time: date.toLocaleTimeString('en-GB'),
            ip,
            cpu,
            ram,
            disk,
            uptime,
            weather,
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
            weather: { temperature: 'Error', condition: 'Error' },
            updateInterval: DAY_INTERVAL
        };
    }
}

app.get('/api/status', async (req, res) => {
    const status = await getStatus();
    res.json(status);
});

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
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
