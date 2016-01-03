# zcrawler
A new generation of crawler/spider

## install
```npm install zcrawler```

## how to use
```javascript

let Crawler = require('zcrawler');

let crawler = new Crawler({
    concurrency: 3
});

// drain event will be fired when all tasks finish
crawler.on('drain', function(e){
    console.log('drain')
});

// empty event will be triggered when the last task is become running and no task exists in the pending queue
crawler.on('empty', function(e){
    console.log('empty')
});

// use regex pattern to listen the event
crawler.on(/baidu\.com/, function(ctx){
    console.log('baidu', ctx.url);
});

// queue a url
crawler.queue('http://www.baidu.com?q=hello');

// queue a url with custom user agent
crawler.queue({
    url: 'http://www.baidu.com',
    headers: {
        'User-Agent': 'ZCrawler'
    }
});

// queue a url with callback.
crawler.queue('http://www.baidu.com?q=world', function(){
    console.log('Finished crawling with callback: body length is %s', this.body.length);
});

// queue a url with options and callback
crawler.queue('http://www.baidu.com?q=hi', {headers: {Cookie: 'sessionid=1232;'}}, function(){
    console.log('Finished crawling with options and callback. Body length is %s', this.body.length);
});

```

## use midware
Use `use()` to create a new midware, just like Koa. You can change the request before `yield next;`, and change the response after `yield next`. 

```

let Crawler = require('zcrawler');

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

```