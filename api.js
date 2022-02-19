
const needle = require("needle");
const analysis = require("./analysis");

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const twitter_auth_token = process.env.BEARER_TOKEN;

const twitter_fetch_endpoint = "https://api.twitter.com/2/tweets"
const twitter_search_endpoint = "https://api.twitter.com/2/tweets/search/recent";
const sentiment_analysis_endpoint = "text-sentiment.p.rapidapi.com/analyze";

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
    const params = {
        "text": sentence,
        headers: {
            "content-type": "application/x-www-form-urlencoded",
		    "x-rapidapi-host": "text-sentiment.p.rapidapi.com",
		    "x-rapidapi-key": "f53851ccbcmshbbea5093eb77f29p19b03ejsna1e05438336a",
		    "useQueryString": true
        }
    };
    /*
    const res = await needle.post('POST', sentiment_analysis_endpoint, params, {
        headers: {
            "content-type": "application/x-www-form-urlencoded",
		    "x-rapidapi-host": "text-sentiment.p.rapidapi.com",
		    "x-rapidapi-key": "f53851ccbcmshbbea5093eb77f29p19b03ejsna1e05438336a",
		    "useQueryString": true
        }
    });
    */
    needle.post(sentiment_analysis_endpoint, params, (err, res) => {
        if(err) { console.log(err);}
        return res;
    });
    /*
    if(res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request to Sentiment Analysis API')
    }
    */
}

// Main API test
(async () => {
    // Testing
    try {
        const response = await SentimentAnalyisis("I am testing the Sentiment Analysis API.");
        console.dir(response, {
            depth: null
        });
    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
    process.exit();
    // Get a single input tweet.
    const input = '1494967753953923072';
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
    // Run a "dumb analysis" to find a keyword in the input tweet.
    const keyword0 = analysis.DumbKeywordAnalysis(tweet_body);
    console.log(keyword0);
    // Get 10 tweets with that keyword.
    var relevant_tweet_bodies = [];
    try {
        // Make request
        const response = await KeywordSearch(10,keyword0);
        console.dir(response, {
            depth: null
        });
        for(var n=0; n<10; n++) {
            relevant_tweet_bodies.push(response.data[n].text);
        }
    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
    // Run a "smart analyisis" to find an important keyword more specific to the input tweet.
    const keyword2 = analysis.SmartKeywordAnalysis([keyword0], tweet_body, relevant_tweet_bodies);

    // Fetch a large sample of tweets with the gathered keywords
    console.log(`=====SEARCHING FOR RELEVANT TWEETS: ${keyword0.toUpperCase()}, ${keyword2.toUpperCase()}=====`);
    var output_unfiltered = {};
    try {
        // Make request
        const response = await KeywordSearch(90,keyword0, keyword2);
        console.dir(response, {
            depth: null
        });
        for(var n=0; n<90; n++) {
            var dat = response.data[n];
            relevant_tweet_bodies[dat.id] = dat.text;
        }
    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
    console.log(output_unfiltered);
    process.exit();
})();