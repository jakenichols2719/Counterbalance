
const needle = require("needle");
const axios = require("axios").default;
const analysis = require("./analysis");

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const twitter_auth_token = process.env.BEARER_TOKEN;

const twitter_fetch_endpoint = "https://api.twitter.com/2/tweets"
const twitter_search_endpoint = "https://api.twitter.com/2/tweets/search/recent";
const sentiment_analysis_endpoint = "text-sentiment.p.rapidapi.com/analyze";

module.exports = {
    run_api_call: async function run_api_call(tweet_id) {
        // Get a single input tweet.
        const input = tweet_id;
        var tweet_body;
        try {
            const response = await TweetFetch(input);
            console.dir(response, {
                depth: null
            });
            tweet_body = response.data[0].text;
        } catch (e) {
            console.log(e);
            process.exit(-1);
        }
        // Do sentiment analysis on the tweet
        var exclude = [];
        var original_tweet_score;
        var original_tweet_ratio;
        try {
            const response = await SentimentAnalyisis(tweet_body);
            for(var n=0; n<response.keywords.length; n++) {
                var word = response.keywords[n];
                console.log(word.word+": "+ word.score);
            }
            original_tweet_score = response.score;
            original_tweet_ratio = response.ratio;
        } catch (e) {
            console.log(e);
            process.exit(-1);
        }
        // Run a "dumb analysis" to find a keyword in the input tweet.
        const keyword0 = analysis.DumbKeywordAnalysis([], tweet_body);
        const keyword1 = analysis.DumbKeywordAnalysis([keyword0], tweet_body);
        // Get 20 tweets with that keyword.
        var relevant_tweet_bodies = [];
        try {
            // Make request
            const response = await KeywordSearch(20,keyword0);
            console.log(response);
            for(var n=0; n<response.meta.result_count; n++) {
                relevant_tweet_bodies.push(response.data[n].text);
            }
        } catch (e) {
            console.log(e);
            process.exit(-1);
        }
        // Run a "smart analyisis" to find an important keyword more specific to the input tweet.
        const keyword2 = analysis.SmartKeywordAnalysis([keyword0], tweet_body, relevant_tweet_bodies);
        const keyword3 = analysis.SmartKeywordAnalysis([keyword0, keyword2], tweet_body, relevant_tweet_bodies);
    
        console.log(`=====SEARCHING FOR RELEVANT TWEETS: ${keyword0.toUpperCase()}, ${keyword2.toUpperCase()}, ${keyword3.toUpperCase()}=====`);
    
        // Fetch a large sample of tweets with the gathered keywords
        /*
        console.log(`=====SEARCHING FOR RELEVANT TWEETS: ${keyword0.toUpperCase()}, ${keyword2.toUpperCase()}, ${keyword3.toUpperCase()}=====`);
        var output_unfiltered = {};
        try {
            // Make request
            const response = await KeywordSearch(10,keyword0, keyword2);
            console.dir(response, {
                depth: null
            });
            for(var n=0; n<10; n++) {
                var dat = response.data[n];
                relevant_tweet_bodies[dat.id] = dat.text;
            }
        } catch (e) {
            console.log(e);
            process.exit(-1);
        }
        */
        var results = null;
        var results = await find_gray([keyword0,keyword2,keyword3/*,keyword3*/]);
        if(results != null ){
            //console.log(results);
        } else {
            console.log("Tweet to specialized, can't find enough results to analyze.");
        }
        return results;
    }    
}

async function TweetFetch(tweet_id) {
    const params = {
        'ids': tweet_id
    };
    const res = await needle('get', twitter_fetch_endpoint, params, {
        headers: {
            "User-Agent": "v2TweetLookupJS",
            "authorization": `Bearer ${twitter_auth_token}`
        }
    });
    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request');
    }
}

// Fetch recent tweets given keywords
async function KeywordSearch() {
    // Concatenate together arguments into a query
    const ct = arguments[0];
    var query_keywords = "";
    for(var n=1; n<arguments.length; n++) {
        query_keywords += arguments[n];
        if(n<arguments.length-1) query_keywords += " ";
    }
    // Edit query parameters below
    // specify a search query, and any additional fields that are required
    // by default, only the Tweet ID and text fields are returned
    const params = {
        'query': query_keywords + " lang:en -is:retweet",
        'expansions': "author_id",
        'max_results': ct
    }

    const res = await needle('get', twitter_search_endpoint, params, {
        headers: {
            "User-Agent": "v2RecentSearchJS",
            "authorization": `Bearer ${twitter_auth_token}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request');
    }
}

async function SentimentAnalyisis(sentence) {
    var options = {
        method: 'GET',
        url: 'https://twinword-sentiment-analysis.p.rapidapi.com/analyze/',
        params: {text: sentence},
        headers: {
            'x-rapidapi-host': 'twinword-sentiment-analysis.p.rapidapi.com',
            'x-rapidapi-key': 'ba3400387cmshd9b45c135332891p1d4d7bjsn1cf2a76f95d2'
        }
    };
    var dat;
    await axios.request(options).then(function (response) {
        dat = response.data;
        //console.log(response.data);
    }).catch(function (error) {
        console.error(error);
    });
    return dat;
}

async function find_gray(keywords) {
    var users = [];
    var search_output = {};
    try {
        // Make request
        const response = await KeywordSearch(50, keywords[0], keywords[1], keywords[2]);
        if(response.meta.result_count < 10) {
            return null;
        }
        for(var n=0; n<response.meta.result_count; n++) {
            var dat = response.data[n];
            if(users.includes(dat.author_id)) {
                continue;
            } else {
                users.push(dat.author_id);
                search_output[dat.id] = dat.text;
            }
        }
    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
    analysis_output = [];
    for(var ID in search_output) {
        var analysis = await SentimentAnalyisis(search_output[ID]);
        var score = analysis.score;
        var ratio = analysis.ratio;
        var gray = score >= .10 && score <= .15 && ratio >= .15;
        if(gray) {
            analysis_output.push('twitter.com/anyuser/status/'+ID);
        }
    }
    return analysis_output;
}