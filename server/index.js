const systemStatus = require('./systemStatus');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;


app.get('/api/status', async (req, res) => {
    const status = await systemStatus.getStatus();
    res.json(status);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
