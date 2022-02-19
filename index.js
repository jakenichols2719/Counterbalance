// index.js

/**
 * Required External Modules
*/

const express = require("express");
const parse = require("body-parser");
const path = require("path");
const api = require("./api");
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
    if(req.query.tid != null) {
        api.run_api_call(req.query.tid).then(result => {
            console.log(result);
            res.render("template-page", {title: "Home", results: result});
        });
    } else {
        res.render("template-page", {title: "Home", results: []});
    }
});


/**
 * Functions
*/
/**
 * Server Activation
*/

app.listen(port, () => {
    console.log("Hello World");
    
    //const results = await run_api_call('1495138894987157504');
    //console.log(results);
});