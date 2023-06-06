const mysql = require('mysql');
const bodyParser = require('body-parser');
const express = require('express');
const multer = require('multer');
const sessions = require('express-session');
const uploads = multer({ dest: 'uploads/' }); // Set the destination folder for uploaded files
const path = require('path');

const fs = require(`fs`)

const pool = mysql.createPool({
  connectionLimit: 10000,
  host: 'im-bodin1.mysql.database.azure.com',
  user: 'azureuser',
  password: 'Passord1',
  database: 'wideshark_db',
  port: 3306,
  ssl: {
    ca: fs.readFileSync('DigiCertGlobalRootCA.crt.pem'),
  },
});


const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
var fileupload = require("express-fileupload");
app.use(fileupload());
// express app should use sessions
const oneDay = 1000 * 60 * 60 * 24; // calculate one day
app.use(sessions({
  secret: "thisismysecretkey",
  saveUninitialized:true,
  cookie: { maxAge: oneDay },
  resave: false 
}));

var session;

app.get('/signup', function (req, res) {
    console.log("signupbuttonclicked")
    res.render('signup.ejs');
    });

app.post('/signup', (req, res) => {
    var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
    password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});
    
    
    var brukernavn = req.body.brukernavn;
    var email = req.body.email;
    var passord = req.body.passord;
    var biografi = req.body.biografi;

    var sql = `INSERT INTO brukere (brukernavn, email, passord, biografi) VALUES (?, ?, ?, ?)`;
    var values = [brukernavn, email, passord, biografi];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }
        console.log('User inserted into database');
        res.render('login.ejs');
    });
});

app.get('/', function (req, res) {

    var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
    password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});
    
    

    con.connect(function(err) {
        //if (err) throw err;
        con.query("SELECT * FROM brukere", function (err, result, fields) {
           if (err) throw err;
           console.log(result);     
                         
           res.render('index.ejs', {
              data: result,
              var1: "tekst"
                 
         }); // render
        }); // select
   });// connect
 }) // app get


app.get('/login', function (req, res) {
    console.log("loginbuttonclicked")
    res.render('login.ejs');
    });

app.post('/login', function (req, res) {
    var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
    password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});
    
    var brukernavn = req.body.brukernavn;
    var passord = req.body.passord;
    console.log(brukernavn, passord)
  
    // perform the MySQL query to check if the user exists
    const sql = 'SELECT * FROM brukere WHERE brukernavn = ? AND passord = ?';
    con.query(sql, [brukernavn, passord], (error, results) => {
        if (error) {
        res.status(500).send('Internal Server Error');
        } else if (results.length === 1) {
          session = req.session
          session.brukernavn = brukernavn

            res.redirect('/feed')

        } else {
        res.redirect('/login?error=invalid');
        }
    });
});



// definer en rute for å vise profilen til en bruker
app.get('/user/:brukernavn', (req, res) => {
  var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
  password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});

  

    const brukernavn = req.params.brukernavn;
    // hent brukerinformasjon fra databasen
    con.query('SELECT * FROM brukere WHERE brukernavn = ?', [brukernavn], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      } else if (results.length === 0) {
        // brukeren ble ikke funnet
        res.status(404).send('Brukeren ble ikke funnet');
      } else {
        // vis brukerprofilen på profilsiden
        const bruker = results[0];
        res.render('user.ejs', { bruker });
      }
    });
  });


  app.get('/', (req, res) => {
    connection.query('SELECT * FROM feed', (error, results) => {
      if (error) {
        console.log('Feil ved henting av meldinger fra databasen:', error);
        res.send('Feil ved henting av meldinger fra databasen!');
      } else {
        console.log('Meldinger hentet fra databasen:', results);
        console.console.log(results);
        res.render('feed.ejs', { 
            
            feed: results
        });
      }
    });
  });



app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});



// Konfigurere multer for opplasting av bilder
const storage = multer.memoryStorage(); // Lagrer bildedataene i minnet (RAM)
const upload = multer({ storage: storage });

app.post('/upload', (req, res) => {
      // Get the file that was set to our field named "image"
      const { image } = req.files;

      // If no image submitted, exit
      if (!image) return res.sendStatus(400);
  
      // Move the uploaded image to our upload folder
      image.mv(__dirname + '/uploads/' + image.name);

  var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
  password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});

  // Save the image name and the user in the database
  const imageName = image.name;
  const brukernavn = req.session.brukernavn;

  // Execute the SQL query to insert the data into the database
  const sql = 'INSERT INTO bilde (bildenavn, eier_bilde) VALUES (?, ?)';
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      return res.sendStatus(500);
    }

    connection.query(sql, [imageName, brukernavn], (error, results) => {
      connection.release(); // Release the connection back to the pool

      if (error) {
        console.error('Error saving image to the database:', error);
        return res.sendStatus(500);
      }

      res.redirect('/feed');
    });
  });
});
app.get('/feed', (req, res) => {

  var con=mysql.createConnection({host:"im-bodin1.mysql.database.azure.com", user:"azureuser", 
  password:"Passord1", database:"wideshark_db", port:3306, ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}});

 
  // Fetch image data from the database
  const sql = 'SELECT * FROM bilde';

  con.query(sql, (error, results) => {
    if (error) {
      console.error('Feil ved henting av bilder fra databasen:', error);
      res.status(500).send('Internal Server Error');
    } else {
      const images = results; // Assign the fetched image data to the 'images' variable
      const brukernavn = req.session.brukernavn; // Get the logged-in username
      console.log("user: ", brukernavn)
      res.render('feed.ejs', { // Pass both 'images' and 'brukernavn' variables to the template
        uploads: images, 
        brukernavn: brukernavn 
      }); 
    }
  });
});

