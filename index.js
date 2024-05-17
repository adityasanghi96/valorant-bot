const express = require('express');
const app = express();
const port = 3005;

require('dotenv').config();

const HenrikDevValorantAPI = require('unofficial-valorant-api');
const vapi = new HenrikDevValorantAPI(process.env.API_KEY);

const fs = require('fs');
const myConsole = new console.Console(fs.createWriteStream('./output.txt'));

const rateLimit = require('express-rate-limit');

let requestCount = 0;
let lastReset = Date.now();

const globalLimiter = (req, res, next) => {
    const currentTime = Date.now();
    if (currentTime - lastReset >= 60000) {
        // Reset every minute
        requestCount = 0;
        lastReset = currentTime;
    }

    requestCount++;

    if (requestCount > 10) {
        res.status(429).send('Too many requests, please try again after a minute');
    } else {
        next();
    }
};

// Apply global rate limiter to all requests
app.use(globalLimiter);

app.get('/', (req, res) => {
    res.send('Stop snooping around >.>');
});

app.get('/valorant/:name/:tag', async (req, res, next) => {
    const name = req.params.name;
    const tag = req.params.tag;

    try {
        const mmr_data = await vapi.getMMR({
            version: 'v2',
            region: 'ap',
            name: name,
            tag: tag,
        });
        if (mmr_data.error) {
            res.send(`Error ${mmr_data.status}`);
            return myConsole.log(`Username: ${name}#${tag} Error: ${mmr_data.status}`);
        }
        res.send(`Current Rank: ${mmr_data.data.current_data.currenttierpatched} - ${mmr_data.data.current_data.ranking_in_tier} RR, Peak Rank: ${mmr_data.data.highest_rank.patched_tier}`);
        myConsole.log(`${name}#${tag} [${mmr_data.data.currenttierpatched}] - ${mmr_data.data.ranking_in_tier} RR`);
    } catch (error) {
        next(error);
    }
});

app.listen(port, () => {
    myConsole.log(`Example app listening at http://localhost:${port}`);
});
