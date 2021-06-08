module.exports = function(filename) {

    const fs = require('fs'), pathlib = require('path');
    const cleanup = new RegExp('\\/\\*node\\>\\>\\>\\*\\/(.*?)\\/\\*\\<\\<\\<node\\*\\/', 'sg');


    selfServeHandler.express = function(app, express, route) {
        if (typeof app === 'function' && app.constructor.name + typeof app.get + typeof app.post + typeof app.cache === 'EventEmitterfunctionfunctionobject') {

            app.get(route || '/' + pathlib.basename(filename), exports.selfServeHandler);
        }
    };

    return selfServeHandler;

    function selfServeHandler(req, res) {
        const sendSelf = function() {
            res.setHeader('content-type', 'application/javascript');
            res.setHeader('content-length', exports.browser_src_len);
            if (exports.browser_src_etag) {
                res.setHeader('etag', exports.browser_src_etag);
            }
            res.statusCode = 200;
            res.end(exports.browser_src);
        };
        if (Buffer.isBuffer(exports.browser_src) && exports.browser_src_len && exports.browser_src_etag) {
            if (typeof exports.browser_src_etag === 'string' && req.headers['if-none-match'] === exports.browser_src_etag) {
                res.setHeader('etag', exports.browser_src_etag);
                res.statusCode = 304;
                return res.end('Not Modified');
            }
            return sendSelf();
        } else {
            fs.readFile(filename, 'utf8', function(err, data) {
                if (err) {
                    res.type('text');
                    res.status(500).send('Internal Error:' + err.message || err.toString());
                }
                exports.browser_src = Buffer.from(data.replace(cleanup, ''));
                exports.browser_src_len = exports.browser_src.length.toString();
                return sendSelf();
            });
        }

    }

};