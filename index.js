'use strict';

var co = require('co');
var thunkify = require('thunkify');
var EventEmitter = require('pattern-emitter');
var request = require('request');
var _ = require('lodash');
var async = require('async');
var zlib = require('zlib');
var requestGet = thunkify(request);
var gunzip = thunkify(zlib.gunzip);
var compose = require('composition');


var CrawlerContext = function(options){
    this.options = options;
    this.url = options.url;
    this.headers = options.headers || {};
    this.callback = options.callback;
};


class Crawler extends EventEmitter
{
    constructor(options) {
        super();
        let defaultOptions = {
            concurrency: 3,
            forceUTF8: true
        };
        let self = this;
        this.options = _.extend(defaultOptions, options);
        this.taskQueue = async.queue(self.process.bind(self), this.options.concurrency);
        this.taskQueue.empty = ()=>this.emit('empty');
        this.taskQueue.drain = ()=>this.emit('drain');
        this.midwares = [];
    }

    queue(url, options, callback) {
        if (arguments.length == 1) {
            if (typeof url == 'string') {
                options = {
                    url: url
                }
            } else {
                options = url;
            }
        } else if (arguments.length == 2) {
            if (typeof url == 'string') {
                if (typeof options == 'function') {
                    callback = options;
                    options = {
                        url: url,
                        callback: callback
                    };
                } else {
                    options['url'] = url;
                }
            } else {
                callback = options;
                options = url;
                options['callback'] = callback;
            }
        } else {
            options['url'] = url;
            options['callback'] = callback;
        }

        options = _.extend(this.options, options);

        let task = new CrawlerContext(options);
        this.taskQueue.push(task);
    }

    process(task, callback) {
        let self = this;
        let middlewares = self.midwares.slice(0, self.midwares.length);
        middlewares.push(self.send);
        var fn = compose(middlewares);
        var ctx = task;
        fn.call(ctx).then(function(val) {
            ctx.response && self.emit(ctx.url, ctx);
            if (ctx.response && ctx.callback) {
                ctx.callback();
            }

            callback();
        }).catch(function(err){
            callback(err);
        });
    }


    use(callback) {
        this.midwares.push(callback);
    }
}

Crawler.prototype.send = function* (next){
    let options = _.pick(this.options, ['url']);
    try {
        let responses = yield requestGet(options);
        let response = responses[0];
        let body = responses[1];
        response.url = response.request.href;
        if (response.headers['content-encoding'] &&
            response.headers['content-encoding'].toLowerCase().indexOf('gzip') >= 0) {
            body = yield gunzip(response.body);

            if (!options.forceUTF8) {
                response.body = body.toString(req.encoding);
            } else {
                response.body = body;
            }
        }

        this.response = response;
        this.body = response.body;

        return response;
    } catch (e) {
        console.log(e);
    }
};

module.exports = Crawler;
