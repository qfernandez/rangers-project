const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

//routes
app.get("/", function(req, res){
    res.render("main");
});

//server listener
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});