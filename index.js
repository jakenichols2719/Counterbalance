// index.js

/**
 * Required External Modules
*/

const express = require("express");
const parse = require("body-parser");
const path = require("path");
/**
 * App Variables
*/

const app = express();
const port = process.env.port || "8080";

/**
 *  App Configuration
*/

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(parse.json());

const analysis = require("./analysis.js")
require("./api.js");

/**
 * Routes Definitions
*/

app.get("/", (req, res) => {
    res.render("template-page", {title: "Home"});
});

/**
 * Server Activation
*/

app.listen(port, () => {
    console.log("Hello World");
    
    const test = "A reminder for eastern Ukraine after attacks apparently by Russia-backed troops hit a school & residential areas. Attacks that indiscriminately strike civilian objects violate international humanitarian law and if committed willfully amount to war crimes."
    //console.log(analysis.DumbKeywordAnalysis(test));

});