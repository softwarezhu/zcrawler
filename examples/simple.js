'use strict';

let Crawler = require('./../index');

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
