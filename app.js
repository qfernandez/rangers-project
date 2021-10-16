const express = require("express");
const mysql   = require("mysql");
const app = express();
const session = require('express-session');

app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use(express.urlencoded()); //use to parse data sent using the POST method
app.use(session({ secret: 'any word', cookie: { maxAge: 1000 * 60 * 5 }}));
app.use(function(req, res, next) {
   res.locals.isAuthenticated = req.session.authenticated; 
   next();
});

//routes
app.get("/", function(req, res){
    res.render("login");
});

app.get("/main", async function(req, res){
    if (req.isAuthenticated) {
        console.log("AUTHENTICATED!");
    }
    let playerList = await getPlayerList(); //change function name
    res.render("main", {"playerList":playerList});
}); // main landing page

app.get("/calendar", function(req, res){
    res.render("calendar");
});

//Update player
app.get("/edit", async function(req, res){
  let playerInfo = await getPlayerInfo(req.query.name);    
  res.render("edit", {"playerInfo":playerInfo});
});

app.post("/edit", async function(req, res){
  let rows = await updatePlayer(req.body);
  let playerInfo = req.body;
  console.log(rows);
  let message = "Player WAS NOT updated!";
  if (rows.affectedRows > 0) {
      message= "Player successfully updated!";
  }
  let playerList = await getPlayerList(); //
  res.render("main", {"message":message, "playerInfo":playerInfo, "playerList":playerList});
    
});

app.post("/loginProcess", async function(req, res) {
    let users = await getScouts();
    var validAcc = false;
    var validPass = false;
    for (var i = 0; i < users.length; i++) {
        if (req.body.username == users[i].scoutUserName) {
            validAcc = true;
            console.log("Authenticated User Name")
        }
        if (validAcc) {
            if (req.body.password == users[i].scoutPassword){
                validPass = true;
                console.log("Authenticated User Password")
                break;
            }
        }
    }
    if (validAcc && validPass) {
        req.session.authenticated = true;
        req.session.user = users[i].scoutId;
        res.send({"loginSuccess":true});
        console.log("succeed")
    } else {
        console.log("failed")
       res.send(false);
    }
}); // loginProcess

app.get("/addPlayer", function(req, res){
  res.render("addPlayer");
});

app.post("/addPlayer", async function(req, res){
  let rows = await insertPlayer(req.body);
  console.log(rows);
  
  let message = "Player WAS NOT added to the database!";
  if (rows.affectedRows > 0) {
      message= "Player successfully added!";
  }
  let playerList = await getPlayerList();
  res.render("main", {"message":message, "playerList":playerList});
    
});

//functions
function getScouts() {
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Login Connected to Database!");
           let sql = `SELECT * FROM scouts`;
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
           });
        }); //connect
    }); //promise
}

function getPlayerList(){
   let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected to Player's Database!");
           let sql = `SELECT *
                        FROM players
                        ORDER BY playerId`;
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}

app.get("/deletePlayer", async function(req, res){
 let rows = await deletePlayer(req.query.id);
 console.log(rows);
  let message = "Player WAS NOT deleted!";
  
  if (rows.affectedRows > 0) {
      message= "Player successfully deleted!";
  }    
    
   let playerList= await getPlayerList();  
   res.render("main", {"playerList":playerList});
});

function getPlayerInfo(name){
   let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           let sql = `SELECT * 
                      FROM players
                      WHERE playerName = ?`;
           conn.query(sql, [name], function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows[0]); //Query returns only ONE record
           });
        });//connect
    });//promise 
} // getPlayerInfo

function updatePlayer(body){
   let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           let sql = `UPDATE players
                      SET playerPosition = ?,
                      playerPicture = ?, 
                      playerAge = ?,
                      playerHeight = ?,
                      playerWeight = ?,
                      playerBats = ?,
                      playerThrows = ?,
                      playerGrade = ?,
                      playerNotes = ?
                      WHERE playerName = ?`;
           let params = [body.position, body.image, body.age, body.height, 
                        body.weight, body.bats, body.throws, body.grade, body.notes, body.name];
           console.log(sql);
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
           });
        });//connect
    });//promise 
}

function insertPlayer(body){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `INSERT INTO players
                        (playerName, playerPosition, playerPicture, playerAge, playerHeight, 
                        playerWeight, playerBats, playerThrows, playerGrade, playerNotes)
                         VALUES (?,?,?,?,?,?,?,?,?,?)`;
           let params = [body.name, body.position, body.image, body.age, body.height, 
                        body.weight, body.bats, body.throws, body.grade, body.notes];
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
} // insertProd

function deletePlayer(id){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `DELETE FROM players
                      WHERE playerId = ?`;
        
           conn.query(sql, [id], function (err, rows, fields) {
              if (err) throw err;
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}

function dbConnection(){
   let conn = mysql.createConnection({
                 host: "us-cdbr-east-04.cleardb.com",
                 user: "bfde8fbd863654",
             password: "def5b96b",
             database: "heroku_1571daea77e289f"
       });

return conn;

}

//server listener
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});

