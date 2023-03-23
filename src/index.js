const express = require("express")
const puppeteer = require('puppeteer');
const path = require("path")
const app = express()
const LogInCollection = require("./mongo")
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.urlencoded({ extended: false }))

const tempelatePath = path.join(__dirname, '../tempelates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', tempelatePath)
app.use(express.static(publicPath))

app.get('/', (req, res) => {
    res.render('login')
})


//...................... here!!!!............................

app.post('/login', async (req, res) => {
    try {
        const check = await LogInCollection.findOne({domain: req.body.url})
        if(check === null){
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(req.body.url);
            const extractedText = await page.$eval('*', (el) => el.innerText);
            const images = await page.$$eval('img', (imgs) =>{
                return imgs.map(img => img.src);
            });
            const arr = extractedText.replace(/[\t\n\r\.\?\!]/gm, ' ').split(' ');
            const count = arr.filter(word => word !== '').length;
            const pageUrls = await page.evaluate(()=>{
            const urlArray = Array.from(document.links).map((link) => link.href);
            const uniqueUrlArray = [...new Set(urlArray)];
            return uniqueUrlArray;
            });
            const data = {
                domain: req.body.url,
                wordcount: count,
                weblink: pageUrls,
                medialink: images,
            }
            console.log("inside login post!!");
            await LogInCollection.insertMany([data]);
            res.status(201).render("login", {
                domain: req.body.url,
                wordcount: count,
                weblink: pageUrls,
                medialink: images,
            });
            console.log("loging response!!!");
            console.log(data);
        }
        else{
            res.status(201).render("login", {
                domain: check.domain,
                wordcount: check.wordcount,
                weblink: check.weblink,
                medialink: check.medialink,
            });
        }
    } 
    catch (e) {
        res.status(400).send("wrong details")
    }
})

app.post('/log', async (req, res) => {
    try {
        const check = await LogInCollection.findOne({domain: req.body.url})
        console.log(check);
        if(check === null){
            throw new Error("no Domain is present like that!");
        }
        else{
            console.log("inside!!");
            res.status(201).render("login",{
                domain: check.domain,
                wordcount: check.wordcount,
                weblink: check.weblink,
                medialink: check.medialink,
            });
        }
    }catch (e) {
        res.status(400).send("not found")
    }
})

app.listen(port, () => {
    console.log('port connected');
})