const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
var admin = require("firebase-admin");
const date = require('date-and-time');
var serviceAccount = require("./serviceAccountKey.json");
var cors = require('cors');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://screenshot-api-1bd79.firebaseio.com"
});


const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
  

const app = express();

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log("Listening on port " + PORT);
});


let db = admin.firestore();

app.post('/signup', (req, res) => {
    admin.auth().createUser({
        email: req.body.email,
        password: req.body.password
      })
        .then(function(userRecord) {
          // See the UserRecord reference doc for the contents of userRecord.
          let startDate = new Date();
          let endDate = date.addMonths(startDate, 1);
          db.collection('users').doc(userRecord.uid).set({
              key: userRecord.uid,
              requests: 100,
              startDate: startDate,
              endDate: endDate,
              startMonth: new Date().getMonth()
          });
          res.status(200).send({
              msg: 'User created',
              shortKey: userRecord.uid
            });
          console.log('Successfully created new user:', userRecord);
        })
        .catch(function(error) {
            res.send({error: error.message});
          console.log('Error creating new user:', error);
    });
})


// POST img request with width and height
app.post('/img/wh',async (req, res) => {
    try{
        var shot = await takeImgScreenshot1(req.body.url, req.body.width, req.body.height);
        console.log(shot);
        const key = req.body.shortKey.trim();
        db.collection('users').doc(key).get().then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
              } else {
                  let request = doc.data().requests;
                  var dateStatus = parseInt(new Date().getMonth()) != parseInt(doc.data().startMonth) ? 0 : 1;
                  if(dateStatus==0){
                      
                    db.collection('users').doc(key).update({
                        requests: 100,
                        startMonth: new Date().getMonth()
                    });

                  }
                  if(request<=0){
                    res.setHeader("content-type", "application/json");
                    res.status(200).send({msg: 'No more requests left'});
                    return ;           
                  }else{
                      request = request - 1;
                  }
                  db.collection('users').doc(key).update({requests: request});
                  res.setHeader("content-type", "image/png");
                  res.status(200).send(shot);
              }
        }).catch(err => {
            console.log(err);
        });
    }catch(error){
        res.setHeader("content-type", "application/json");
		res.status(422).send(JSON.stringify({
			error: error.message,
        }));
    }
});

async function takeImgScreenshot1(url, width, height){
    console.log(width);
    console.log(height);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}`, {waitUntil: 'load', timeout: 60000});
    await page.setViewport({width: parseInt(width), height: parseInt(height)});
    const buffer = await page.screenshot({
        fullPage: true
    });
    
    await page.close();
    await browser.close();
    return buffer;
}


// POST img request without width and height
app.post('/img',async (req, res) => {
    try{
        var shot = await takeImgScreenshot2(req.body.url);
        console.log(req.body.shortKey);
        const key = req.body.shortKey.trim();
        db.collection('users').doc(key).get().then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
              } else {
                  let request = doc.data().requests;
                  var dateStatus = parseInt(new Date().getMonth()) != parseInt(doc.data().startMonth) ? 0 : 1;
                  if(dateStatus==0){
                      
                    db.collection('users').doc(key).update({
                        requests: 100,
                        startMonth: new Date().getMonth()
                    });

                  }
                  if(request<=0){
                    res.setHeader("content-type", "application/json");
                    res.status(200).send({msg: 'No more requests left'});
                    return ;              
                  }else{
                      request = request - 1;
                  }
                  db.collection('users').doc(key).update({requests: request});
                  res.setHeader("content-type", "image/png");
                  res.status(200).send(shot);
              }
        }).catch(err => {
            console.log(err);
        });
    }catch(error){
        res.setHeader("content-type", "application/json");
		res.status(422).send(JSON.stringify({
			error: error.message,
        }));
    }
});

async function takeImgScreenshot2(url){
    console.log(url);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}`, {waitUntil: 'load', timeout: 60000});
    const buffer = await page.screenshot({
        fullPage: true
    });
    
    await page.close();
    await browser.close();
    return buffer;
}

// POST pdf request without width and height
app.post('/pdf',async (req, res) => {
    try{
        var shot = await takePdfScreenshot2(req.body.url);
        console.log(shot);
        const key = req.body.shortKey.trim();
        db.collection('users').doc(key).get().then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
              } else {
                  let request = doc.data().requests;
                  console.log(new Date().getMonth());
                  var dateStatus = parseInt(new Date().getMonth()) != parseInt(doc.data().startMonth) ? 0 : 1;
                  if(dateStatus==0){
                    console.log("Come here");  
                    db.collection('users').doc(key).update({
                        requests: 100,
                        startMonth: new Date().getMonth()
                    });

                  }
                  if(request<=0){
                    res.setHeader("content-type", "application/json");
                    res.status(200).send({msg: 'No more requests left'});
                    return ;              
                  }else{
                      console.log(doc.data());
                      request = request - 1;
                  }
                  db.collection('users').doc(key).update({requests: request});
                  res.setHeader("content-type", "application/pdf");
                  res.status(200).send(shot);
              }
        }).catch(err => {
            console.log(err);
        });

    }catch(error){
        res.setHeader("content-type", "application/json");
		res.status(422).send(JSON.stringify({
			error: error.message,
        }));
    }
});

async function takePdfScreenshot2(url){
    console.log(url);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}`, {waitUntil: 'load', timeout: 90000});
    const buffer = await page.pdf({
        fullPage: true,
        format: 'A4'
    });
    
    await page.close();
    await browser.close();
    return buffer;
}
