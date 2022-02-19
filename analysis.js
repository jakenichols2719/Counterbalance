const { toNamespacedPath } = require("path");

// 100 most common english words, plus additions as problematic words are found
const common = ['the','of','to','and','a','in','is','it','its',"it's",'you','that','he','was','for','on','are','with',
'as','I','his','they','be','at','one','have','this','from','or','had','by','not','word','but','what','some',
'we','can','out','other','were','all','there','when','up','use','your','how','said','an','each','she',
'which','do','their','time','if','will','way','about','many','then','them','write','would','like','so',
'these','her','long','make','thing','see','him','two','has','look','more','day','could','go','come','did',
'number','sound','no','most','people','my','over','know','water','than','call','first','who','may','down',
'side','been','now','find','any','us'];
const filter = ['fuck','shit','yes','amp','un','really','just'];

const unwanted = ['@', 'http', 'www', 't.co', 'bit.ly', '.com', '.org', '.net']

module.exports = {
    // Get the word with highest occurence, tiebreaking with the longest words
    DumbKeywordAnalysis : function DumbKeywordAnalysis(used_keywords, sentence) {
        const sani_sentence = Sanitize(sentence).filter(word => !used_keywords.includes(word));
        const counts = tf(sani_sentence);
        const lengths = tlen(sani_sentence);
        var max_tf = 0
        var max_tf_word;
        sani_sentence.forEach(word => {
            if(counts[word] > max_tf || counts[word]==max_tf && lengths[word] > lengths[max_tf_word]) {
                max_tf = counts[word]
                max_tf_word = word
            }
        });
        return max_tf_word;
    },
    SmartKeywordAnalysis : function SmartKeywordAnalysis(used_keywords, sentence, others) {
        const sani_sentence = Sanitize(sentence).filter(word => !used_keywords.includes(word));
        const sani_others = others.map(s => Sanitize(s));
        const s_tf = tf(sani_sentence);
        const s_idf = idf(sani_sentence, sani_others);
        var max_tf_idf = 0;
        var max_tf_idf_word;
        sani_sentence.forEach(word => {
            
            var ratio = s_tf[word] * s_idf[word];
            //console.log(word + ", " + ratio);
            if(ratio > max_tf_idf) {
                max_tf_idf = ratio;
                max_tf_idf_word = word;
            }
        });
        return max_tf_idf_word;
    }
};


// Tokenize a sentence into an array of words
function Tokenize(sentence) {
    // Get rid of newlines
    sentence = sentence.replace(/\n/g, " ");
    const tokens = sentence.split(" ").map(word => word.toLowerCase());
    var clean = []
    tokens.forEach(token => {
        if(token != '') clean.push(token);
    })
    return clean;
}

function RemovePunctuation(sentence_arr) {
    var sentence_out = []
    //sentence_out = sentence_arr.map(word => word.replace(/[.,\/#!$%\^&\*;:{}=—\-_`~()]/g, " "));
    sentence_arr.forEach(word => {
        var spacing = word.replace(/[—\-]/g, " ");
        var nonspacing = spacing.replace(/[.,\/#\?!$%\^&\*;:{}=_`~()]/g, "");
        var depossesed = nonspacing.replace(/’./g, "").replace(/\s{2,}/g," ");
        //var temp = word.replace(/[.,\/#!$%\^&\*;:{}=—\-_`~()]/g, "").replace(/\s{2,}/g," ");
        Tokenize(depossesed).forEach(new_word => { sentence_out.push(new_word); });
    });
    return sentence_out;
}

// Remove common words from a list of words
function RemoveCommon(sentence_arr) {
    var sentence_out = []
    sentence_out = sentence_arr.filter(word => !common.includes(word.toLowerCase()) && !filter.includes(word.toLowerCase()));
    return sentence_out;
}

function RemoveUnwanted(sentence_arr) {
    var sentence_out = []
    sentence_out = sentence_arr.filter(word => {
        var valid = true;
        for(var n=0; n<unwanted.length; n++) {
            valid = valid && !word.includes(unwanted[n]);
        }
        return valid;
    });
    return sentence_out;
}

function Sanitize(sentence) {
    const list = Tokenize(sentence)
    const ru = RemoveUnwanted(list);
    const rc = RemoveCommon(ru);
    const rp = RemovePunctuation(rc);
    return rp;
}

function tf(sentence_arr) {
    var counts = {}
    for(var word of sentence_arr) {
        counts[word] = counts[word] ? counts[word] + 1 : 1;
    }
    return counts;
}

function idf(sentence_arr, other_sentence_arrs) {
    var counts = {}
    var cur = 1;
    const other_ct = other_sentence_arrs.length;
    sentence_arr.forEach(word => counts[word] = Math.log((other_ct+1)/1.0));
    other_sentence_arrs.forEach(other_sentence => {
        sentence_arr.forEach(word => {
            if(other_sentence.includes(word)) {
                counts[word] = Math.log(11.0/cur+1);
            }
        });
        cur++;
    });
    return counts;
}

function tlen(sentence_arr) {
    var counts = {}
    for(var word of sentence_arr) {
        counts[word] = word.length;
    }
    return counts;
}
