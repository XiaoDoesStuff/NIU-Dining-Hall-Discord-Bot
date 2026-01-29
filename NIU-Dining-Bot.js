const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
let formattedDate;
require(`dotenv`).config({path: "./Config.env"});
// ------------------------------------------------------------
// Discord Client
// ------------------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ------------------------------------------------------------
// Config - pulls from docker-compose.yml
// ------------------------------------------------------------
const ALERT_CHANNEL = process.env.CHANNEL;
const TOKEN = process.env.DINING_BOT_TOKEN;
const Check_Time = parseInt(process.env.WHEN_TO_CHECK);
const PATTERSONBREAKFASTCHECK = process.env.CHECK_PATTERSON_BREAKFAST;
const NEPTUNEBREAKFASTCHECK = process.env.CHECK_NEPTUNE_BREAKFAST;
const PATTERSONLUNCHCHECK = process.env.CHECK_PATTERSON_LUNCH;
const NEPTUNELUNCHCHECK = process.env.CHECK_NEPTUNE_LUNCH;
const PATTERSONDINNERCHECK = process.env.CHECK_PATTERSON_DINNER;
const NEPTUNEDINNERHCHECK = process.env.CHECK_NEPTUNE_DINNER;

let KEYWORDS = [];

if (process.env.KEYWORDSTOCHECK) {
    try {
        KEYWORDS = JSON.parse(process.env.KEYWORDSTOCHECK);
    } catch (e) {
        console.error("Failed to parse KEYWORDS env var as JSON:", e);
    }
}

// ------------------------------------------------------------
// Extract HTML from today's Menu for a certain dining hall and meal via Puppeteer
// ------------------------------------------------------------
async function getMenuHTML(hall, meal) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Safari/537.36"
        );

        await page.goto("https://saapps.niu.edu/NetNutrition/menus", {
            waitUntil: "networkidle2"
        });

        await page.evaluate((hall) => {
            const link = [...document.querySelectorAll("a")]
                .find(a => a.textContent.includes(`${hall} Dining`));
            if (link) link.click();
        }, hall);

        await page.waitForFunction((hall) => {
            return [...document.querySelectorAll("a")]
                .some(a => a.textContent.includes(`${hall} Daily Menu`));
        }, { timeout: 20000 }, hall);

        await page.evaluate((hall) => {
            const link = [...document.querySelectorAll("a")]
                .find(a => a.textContent.includes(`${hall} Daily Menu`));
            if (link) link.click();
        }, hall);

        await page.waitForFunction((hall) => {
            return document.body.innerText.includes(`Menus for ${hall} Daily Menu`);
        }, { timeout: 20000 }, hall);

        await new Promise(r => setTimeout(r, 300));

        await page.waitForSelector("table.cbo_nn_menuTable", { timeout: 20000 });

        const today = new Date(
            new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
        );

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };

        formattedDate = today.toLocaleDateString("en-US", options);

        await page.evaluate((targetDate, meal) => {
            const dateRows = document.querySelectorAll(
                "tr.cbo_nn_menuPrimaryRow, tr.cbo_nn_menuAlternateRow"
            );

            for (const row of dateRows) {
                const dateCell = row.querySelector("td");
                if (!dateCell) continue;

                const dateText = dateCell.textContent.trim();

                if (dateText.includes(targetDate)) {
                    const previousRow = row.previousElementSibling;
                    if (!previousRow) return;

                    const mealRow = previousRow.nextElementSibling;
                    if (!mealRow) return;

                    const links = mealRow.querySelectorAll("a.cbo_nn_menuLink");
                    if (links.length === 0) return;

                    const mealLink = [...links].find(a =>
                        a.textContent.includes(meal)
                    );

                    if (mealLink) mealLink.click();
                    return;
                }
            }
        }, formattedDate, meal);

        await page.waitForFunction(() => {
            const p = document.querySelector("#itemPanel");
            return p && p.style.visibility === "visible";
        }, { timeout: 20000 });

        const fullHTML = await page.$eval("#itemPanel", el => el.innerHTML);

        await browser.close();
        return fullHTML;

    } catch (err) {
        console.log(`Timeout — exiting function. ${meal} for ${hall} cannot be found today`);
        return;
    }
}

// ------------------------------------------------------------
// Keyword Detection
// ------------------------------------------------------------
function detectKeywords(html, hall, meal) {
    const $ = cheerio.load(html);
    const items = [];

    const selectors = [
        ".cbo_nn_itemName",
        ".cbo_nn_itemName *",
        ".cbo_nn_itemHover",
        ".cbo_nn_itemHover *"
    ];

    selectors.forEach(sel => {
        $(sel).each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 0) items.push(text);
        });
    });

    console.log(`${formattedDate}'s ${hall} ${meal} menu was checked`);
    console.log("=== PARSED ITEMS ===");
    console.log(items);
    console.log("====================");

    return items.filter(item =>
        KEYWORDS.some(keyword =>
            item.toLowerCase().includes(keyword.toLowerCase())
        )
    );
}

// ------------------------------------------------------------
// Send Alert
// ------------------------------------------------------------
async function sendAlert(found, date, hall, meal) {
    try {
        const channel = await client.channels.fetch(ALERT_CHANNEL);

        await channel.send({
            content: [
                "",
                `Menu Alert for **${hall}'s ${meal}**`,
                `Date: **${date}**`,
                `Matched items: ${found.join(", ")}`,
                "..."
            ].join("\n")
        });

    } catch (err) {
        console.error("Menu bot: failed to send alert:", err);
    }
}

// ------------------------------------------------------------
// Main Check
// ------------------------------------------------------------
async function checkMenu(hall, meal) {
    console.log(`Menu bot: checking menu of ${hall} for today's ${meal}`);

    const html = await getMenuHTML(hall, meal);

    if (!html) {
        console.log("Menu bot: failed to load menu HTML");
        return;
    }

    const found = detectKeywords(html, hall, meal);

    if (found.length > 0) {
        console.log("Menu bot: matches detected:", found);
        await sendAlert(found, formattedDate, hall, meal);
    } else {
        console.log("Menu bot: no matches today.");
    }
}

// ------------------------------------------------------------
// Daily Scheduling
// ------------------------------------------------------------
function scheduleDaily(task) {
    function msUntilNext() {
        const now = new Date();
        const chicagoNow = new Date(
            now.toLocaleString("en-US", { timeZone: "America/Chicago" })
        );

        const next = new Date(chicagoNow);
        next.setHours(Check_Time, 0, 0, 0);

        if (next <= chicagoNow) {
            next.setDate(next.getDate() + 1);
        }

        return next - chicagoNow;
    }

    setTimeout(() => {
        task();
        setInterval(task, 24 * 60 * 60 * 1000);
    }, msUntilNext());
}

// ------------------------------------------------------------
// Startup
// ------------------------------------------------------------
client.once("clientReady", async () => {
    console.log(`Menu bot ready as ${client.user.tag}`);

    if (NEPTUNEBREAKFASTCHECK == "1") {
        await checkMenu("Neptune", "Breakfast");
    }

    if (NEPTUNELUNCHCHECK == "1") {
        await checkMenu("Neptune", "Lunch");
    }

    if (NEPTUNEDINNERHCHECK == "1") {
        await checkMenu("Neptune", "Dinner");
    }

    if (PATTERSONBREAKFASTCHECK == "1") {
        await checkMenu("Patterson", "Breakfast");
    }

    if (PATTERSONLUNCHCHECK == "1") {
        await checkMenu("Patterson", "Lunch");
    }

    if (PATTERSONDINNERCHECK == "1") {
        await checkMenu("Patterson", "Dinner");
    }

    scheduleDaily(async () => {
        if (NEPTUNEBREAKFASTCHECK == "1") {
            await checkMenu("Neptune", "Breakfast");
        }

        if (NEPTUNELUNCHCHECK == "1") {
            await checkMenu("Neptune", "Lunch");
        }

        if (NEPTUNEDINNERHCHECK == "1") {
            await checkMenu("Neptune", "Dinner");
        }

        if (PATTERSONBREAKFASTCHECK == "1") {
            await checkMenu("Patterson", "Breakfast");
        }

        if (PATTERSONLUNCHCHECK == "1") {
            await checkMenu("Patterson", "Lunch");
        }

        if (PATTERSONDINNERCHECK == "1") {
            await checkMenu("Patterson", "Dinner");
        }
    });
});

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
client.login(TOKEN);
