
module.exports = function(filename,etagger) {

    const fs = require('fs'), pathlib = require('path'),crypto=require('crypto');
    const cleanup = new RegExp('\\/\\*node\\>\\>\\>\\*\\/(.*?)\\/\\*\\<\\<\\<node\\*\\/', 'sg');
    etagger = etagger || function(filename,src,cb){
        fs.stat(filename,function(err,stat){
            if (err) return cb();
            const when = stat.mtimeMs;
            return cb(
                Math.floor(when).toString(36)+"-"+
                crypto.createHash("sha256").update(src).digest("hex"),
                when);
        });
    };
    var callerStack,last_time;
    const qc_check = function (src) {
        try {
            const vm = require('vm');
            const script = new vm.Script(src);
            return '/* source seems like valid javascipt */';
        } catch(e) {
            return '/* javascript error: '+e.message+' */';
        }
        
    }
    const handler = function (req, res) {
        callerStack = callerStack || new Error().stack.split("\n").slice(1);
        const checkFile=function(cb){
            fs.stat(filename,function(err,stat){
               if (err) return cb(false);
               if (last_time!==stat.mtimeMs) {
                   last_time = stat.mtimeMs;
                   cb(true);
               } else {
                   cb(false);
               }
            });
        };
        
        const sendSelf = function() {
            res.setHeader('content-type', 'application/javascript');
            res.setHeader('content-length', handler.browser_src_len);
            if (handler.browser_src_etag) {
                res.setHeader('etag', handler.browser_src_etag);
            }
            res.statusCode = 200;
            res.end(handler.browser_src);
        };
        checkFile(function(hasChanged){
            if (!hasChanged && Buffer.isBuffer(handler.browser_src) && handler.browser_src_len && handler.browser_src_etag) {
                if (typeof handler.browser_src_etag === 'string' && req.headers['if-none-match'] === handler.browser_src_etag) {
                    res.setHeader('etag', handler.browser_src_etag);
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
                    etagger(filename,data,function(etag,when){
                        const clean = data.replace(cleanup, '');
                        handler.browser_src = Buffer.from(
                            "//self-served: file modification time : "+(new Date(when).toUTCString())+", ETag:"+etag+"\n"+
                            "//via "+handler.name+"() in "+filename+",called by "+callerStack[1].split("at ")[1]+"\n"+
                            qc_check(clean)+"\n"+
                            clean
                        );
                        handler.browser_src_len = handler.browser_src.length.toString();
                        handler.browser_src_etag = etag;
                        return sendSelf();
                    });
                });
            }
        });

      };

    handler.express = function(app, express, route) {
        if (typeof app === 'function' && app.constructor.name + typeof app.get + typeof app.post + typeof app.cache === 'EventEmitterfunctionfunctionobject') {

            app.get(route || '/' + pathlib.basename(filename), handler);
        }
    };
    
    Object.defineProperty(handler,"name",{
        value:'serve_'+pathlib.basename(filename).replace(/\.js$/,'').replace(/[\.\_-]/g,''),
        enumerable:false
    });
  
    return handler;

    

};
// there is no point in serving this file as it does nothing in the browser
// however to demo the library:
/*

   var app = require("express")();
   
   app.on("/somefile.js",require("self-serve-handler").handler);


*/
module.exports.selfServeHandler = module.exports(__filename);

