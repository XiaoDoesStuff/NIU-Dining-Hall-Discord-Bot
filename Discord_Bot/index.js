const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
let formattedDate;

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
// Config
// ------------------------------------------------------------
const ALERT_CHANNEL = "1462718308712321116";   // rename as needed
const KEYWORDS = ["chiliS"]; // empty by default — add whatever you want
const TOKEN = process.env.DINING_BOT_TOKEN;    // rename env var if desired

// ------------------------------------------------------------
// Extract Today's Menu HTML via Puppeteer
// ------------------------------------------------------------
async function getTodayMenuHTML() {
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

    await page.evaluate(() => {
        const link = [...document.querySelectorAll("a")]
            .find(a => a.textContent.includes("Neptune Dining"));
        if (link) link.click();
    });

    await page.waitForFunction(() => {
        return [...document.querySelectorAll("a")]
            .some(a => a.textContent.includes("Neptune Daily Menu"));
    }, { timeout: 20000 });

    await page.evaluate(() => {
        const link = [...document.querySelectorAll("a")]
            .find(a => a.textContent.includes("Neptune Daily Menu"));
        if (link) link.click();
    });

    await page.waitForFunction(() => {
        return document.body.innerText.includes("Menus for Neptune Daily Menu");
    }, { timeout: 20000 });

    await new Promise(r => setTimeout(r, 300));

    await page.waitForSelector("table.cbo_nn_menuTable", { timeout: 20000 });

    const today = new Date();
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    formattedDate = today.toLocaleDateString("en-US", options);

    await page.evaluate((targetDate) => {
        const dateRows = document.querySelectorAll(
            "tr.cbo_nn_menuPrimaryRow, tr.cbo_nn_menuAlternateRow"
        );

        for (const row of dateRows) {
            const dateCell = row.querySelector("td");
            if (!dateCell) continue;

            const dateText = dateCell.textContent.trim();

            if (dateText.includes(targetDate)) {
                const mealRow = row.nextElementSibling;
                if (!mealRow) return;

                const links = mealRow.querySelectorAll("a.cbo_nn_menuLink");
                if (links.length === 0) return;

                const lunchLink = [...links].find(a => a.textContent.includes("Lunch"));
                if (lunchLink) lunchLink.click();

                return;
            }
        }
    }, formattedDate);

    await page.waitForFunction(() => {
        const p = document.querySelector("#itemPanel");
        return p && p.style.visibility === "visible";
    }, { timeout: 20000 });

    const fullHTML = await page.$eval("#itemPanel", el => el.innerHTML);

    await browser.close();
    return fullHTML;
}

// ------------------------------------------------------------
// Keyword Detection (formerly shrimp detection)
// ------------------------------------------------------------
function detectKeywords(html) {
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

    console.log(`${formattedDate}'s menu was checked`);
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
async function sendAlert(found) {
    try {
        const channel = await client.channels.fetch(ALERT_CHANNEL);

        await channel.send({
            content: `Menu Alert: Found items matching your keywords: ${found.join(", ")}`
        });

    } catch (err) {
        console.error("Menu bot: failed to send alert:", err);
    }
}

// ------------------------------------------------------------
// Main Check
// ------------------------------------------------------------
async function checkMenu() {
    console.log("Menu bot: checking menu…");

    const html = await getTodayMenuHTML();
    if (!html) {
        console.log("Menu bot: failed to load menu HTML");
        return;
    }

    const found = detectKeywords(html);

    if (found.length > 0) {
        console.log("Menu bot: matches detected:", found);
        await sendAlert(found);
    } else {
        console.log("Menu bot: no matches today.");
    }
}

// ------------------------------------------------------------
// Daily Scheduling
// ------------------------------------------------------------
function scheduleDaily8AM(task) {
    function msUntilNext8AM() {
        const now = new Date();
        const chicagoNow = new Date(
            now.toLocaleString("en-US", { timeZone: "America/Chicago" })
        );

        const next = new Date(chicagoNow);
        next.setHours(8, 0, 0, 0);

        if (next <= chicagoNow) {
            next.setDate(next.getDate() + 1);
        }

        return next - chicagoNow;
    }

    setTimeout(() => {
        task();
        setInterval(task, 24 * 60 * 60 * 1000);
    }, msUntilNext8AM());
}

// ------------------------------------------------------------
// Startup
// ------------------------------------------------------------
client.once("clientReady", async () => {
    console.log(`Menu bot ready as ${client.user.tag}`);
    await checkMenu();
    scheduleDaily8AM(async () => {
        await checkMenu();
    });
});

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
client.login(TOKEN);
