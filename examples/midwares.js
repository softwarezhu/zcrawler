'use strict';

let Crawler = require('./../index');

let crawler = new Crawler({
    concurrency: 3
});

// create a midware that block duplicate urls
let sets = new Set();
crawler.use(function* uniq(next) {
    if (sets.has(this.url)) {
        console.log('url %s is ignored', this.url);
        return;
    } else {
        sets.add(this.url);
        yield next;
    }
});

// create a midware that logs the status and time
crawler.use(function* logger(next) {
    let startTime = Date.now();
    yield next;
    let endTime = Date.now();
    console.log("status: %s, elapsed: %s, url: %s", this.response.statusCode, endTime - startTime, this.url);
});

// create a midware that dynamically change the user agent
let i = 0;
crawler.use(function*(next) {
    let agents = ['ZCrawler1', 'ZCrawler2'];
    this.headers['User-Agent'] = agents[i];
    i = parseInt(!!i);
    yield next;
});

// create a midware that convert the response text to json
crawler.use(function*(next) {
    yield next;
    try {
        this.body = JSON.parse(this.body)
    } catch (e) {
        console.log(e);
    }
});
crawler.on('drain', function(e){
    console.log('drain')
});

crawler.on('empty', function(e){
    console.log('empty')
});

crawler.on(/baidu\.com/, function(response){
    console.log('baidu', response.url);
});

// queue a url
crawler.queue('http://www.baidu.com?q=hello');