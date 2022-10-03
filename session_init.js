const puppeteer = require("puppeteer");
const fs = require("fs");

file = "credlist.txt";
var ids = {};
var file_lst = require("fs")
    .readFileSync(file)
    .toString()
    .split(String.fromCharCode(10));
for (i of file_lst) {
    ids[i.split(",")[0]] = i.split(",")[1];
}

var page;
async function initFBSession(id, pass) {
    let browser;

    let puppeteerOptions = {
        headless: true,
        args: [
            "--window-size=1270x950",
            "--disable-crash-reporter",
            "--lang=en-EN,en",
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
        defaultViewport: null,
    };

    try {
        browser = await puppeteer.launch(puppeteerOptions);

        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
        );
        await page
            .goto("https://www.facebook.com/ads/manager")
            .catch(function gotoError(error) {
                console.log("Campaign Manager Login window" + error);
            });

        var button_FB = await page.$('button[data-cookiebanner="accept_button"]');

        await button_FB.click();
        await page.waitForTimeout(1000);

        await page.type("input#email", id, { delay: 10 });
        await page.type("input#pass", pass, { delay: 10 });
        button_FB = await page.$('button[name="login"]');
        await button_FB.click();

        await page.setRequestInterception(true);
        var tokenandid = await getTokenFB(page);
        await page.close();
        await browser.close();
    } catch (err) {
        console.log(err);
        await page.close();
        await browser.close();
    }
    return tokenandid;
}

async function getCookies(page) {
    var cookies = await page.cookies();
    cookies = Array.prototype.slice.call(cookies);
    cookies = cookies
        .map((cookie) => {
            return `${cookie.name}=${cookie.value}`;
        })
        .join("; ");
    return cookies;
}

async function getTokenFB(page) {
    var url, index, accountId_part, token;

    page.on("request", (interceptedRequest) => {
        url = interceptedRequest.url();
        filter = /access_token=[\s\S]*&__cppo/g;
        index = url.match(filter);
        if (index) {
            accountId_part =
                url.match(/act_\d*/g)[0].split("act_")[1] || account_Id_part;
            token =
                url
                .match(/access_token=[\s\S]*&__cppo/g)[0]
                .split("access_token=")[1]
                .split("&__cppo")[0] || token;
        }
        interceptedRequest.continue();
    });

    await page.reload({ waitUntil: ["networkidle2"] });

    cookies = await getCookies(page);
    console.log(accountId_part.toString(), token.toString());

    return [accountId_part.toString(), token.toString(), cookies];
}

async function tokenWriter(ids) {
    var creds_lst = [];

    for (i in ids) {
        try {
            var creds = await initFBSession(i, ids[i]);
        } catch (error) {
            console.log(i, ids[i], "\n");
        }
        creds_lst.push("\n");
        creds_lst.push(creds);
    }
    await fs.writeFile("FB.cnf", creds_lst.toString(), function(err, result) {
        if (err) console.log("error", err);
    });

    console.log(`finished`);
}

tokenWriter(ids);
