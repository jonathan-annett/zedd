const lib = module.exports = {

    ZeddAsMiddleWare: ZeddAsMiddleWare

};

const {diff, apply_diff/*,sha1*/ } = (lib.stringDiffRegex = require ('string-diff-regex')).utils;

const { sha1,forwardSubstring,reverseSubstring,collectSlices, openDiffer, nodeMiddleware } = (lib.hashDiffMiddleware = require ('./hashdiffmware.js') ) ;

const hashDiffJSHandler =  lib.hashDiffMiddleware.selfServeHandler;
const hashDiffJSURL = '/hashdiffmware.js';

const stringDiffHandler = lib.stringDiffRegex.selfServeHandler;
const stringDiffURL = '/string-diff-regex.js';

//console.log({diff, apply_diff,sha1});

const upgrade_header_name = 'x-zedd-rest-upgrade';
const upgrade_header_value  = '1';

const upgrade_headers = {}; upgrade_headers [upgrade_header_name] = upgrade_header_value;

const X_SHA1_Header = 'x-sha1';
const X_ContentLength = 'x-content-cength';

var qs = require("querystring");
var fs = require("fs");
var path = require("path");
    
function ZeddAsMiddleWare(options, handlerOptions) {
    const crypto = require('crypto');
    const REST = {
        GET:    GET,
        PUT:    PUT,
        POST:   POST,
        PATCH:  PATCH,
        DELETE: DELETE,
        HEAD:   HEAD
    };
    
    const hashes = {};

    const leadingDoubleSlash = /^\/\//;
    const singleSlash = '/';
    const {
        authenticationHandler, 
        authenticate, 
        standardRequestHandler,
        bufferPostRequest,
        ROOT,
        httpError
    } = handlerOptions,
    
    hashDiffMiddleWare =  nodeMiddleware(undefined,undefined,upgrade_headers,standardRequestHandler,standardRequestHandler);
    
    
    
    function reqLogger(req,res){
        let ts,tok;
        req.__zedd = {
            timestamp : ts=Date.now(),
            token     : tok=Math.random().toString(36).replace(/^0./,'@'),
            log : function (){
                const when = new Date();
                var msec = ((when.getTime()-ts)/1000).toString();
                msec = msec.substr(0,msec.indexOf(".")+3)+" msec";
                console.log.apply(console,[].concat.apply([when.toString().split(' ')[4]+" req "+tok,msec,req.url],arguments));
            }
        };
        res.addListener('finished',function(){
            req.__zedd.log("finished");
        })
        return req.__zedd;
    }
    
    function selfServes(req,res,next) {
        
        if (req.url===stringDiffURL) {
            //console.log(req.method,req.url);
            return stringDiffHandler(req,res);
          }
        
        
        if (req.url===hashDiffJSURL) {
           // console.log(req.method,req.url);
            return hashDiffJSHandler(req,res);
          }
        
        
        next ();

    }
    

    if (typeof options.route === 'string') {
        const sliceFrom = options.route.length - 1;
        const upgrade_prefix = '/zedd-upgrade?' + options.route.replace(/^\//, '');
        console.log("ZeddAsMiddleWare: using middleWareStringPrefix[ " + options.route + " ]")
        return function middleWareStringPrefix(req, res, next) {
           
            if (req.url.startsWith(options.route)) {
                reqLogger(req,res).log("detected zedd");
                return selectAPI(req, res, req.url.substr(sliceFrom));
            } 

            if (req.url.startsWith(upgrade_prefix)) {
                reqLogger(req,res).log("upgrading to enhanced REST api");
                res.statusCode = 200;
                return res.end('upgrade');
            }
            
            
            return selfServes(req,res,next);


        };
        
    } else {
        if (typeof options.route === 'object' && options.route.constructor === RegExp) {
            const regExp = options.route;
            const upgradeFilter = /\/zedd-upgrade\?/;
            console.log("ZeddAsMiddleWare: using middleWareRegexReplace[ " + regExp.toString() + " ]")

            return function middleWareRegexReplace(req, res, next) {
               
                const test = regExp.exec(req.url);
                if (test) {
                    reqLogger(req,res).log(req.url);
                    return selectAPI(req, res, req.url.replace(regExp, '/'));
                }  
                
                if (upgradeFilter.test(req.url)) {
                    if (regExp.exec(req.url.replace(upgradeFilter, '/'))) {
                        reqLogger(req,res).log("upgrading to enhanced REST api");

                        res.statusCode = 200;
                        return res.end('upgrade');
                    }
                }

                return selfServes(req,res,next);

            };
            
        } else {
            console.log("ZeddAsMiddleWare: using default handler - no compatible route detection available.");
            return function(req, res) {

                const upgrade_prefix = '/zedd-upgrade?';

                if (req.url.startsWith(upgrade_prefix)) {
                    reqLogger(req,res).log("upgrading to enhanced REST api");
                    res.statusCode = 200;
                    return res.end('upgrade');
                } 
                
                
                return selfServes(req,res,function(){
                      reqLogger(req,res);
                      selectAPI(req, res);
                });

                
            };
        }

    }



    function selectAPI(req, res, url) {
        if (url) {
            req.url = url.replace(leadingDoubleSlash, singleSlash);
        } else {
            req.url = req.url.replace(leadingDoubleSlash, singleSlash);
        }

        const enh = req.headers[upgrade_header_name] === upgrade_header_value;
        if (enh) {
            delete req.headers[upgrade_header_name];
            authenticate(req,res,enhancedAPI);
        } else {
            //req.__zedd.log('Zedd REST:', req.method, req.url)
            req.__zedd.log("not enhanced:",req.method,req.url);
                   
            return authenticationHandler(req, res);
        }
    }


    function enhancedAPI(req, res) {
        return (REST[req.method] || standardRequestHandler)(req, res);
    }

    function functionCloner (req,res,prop,cb){
        return function( ) {
            const args = [].concat.apply([],arguments);
            
            if (typeof cb==='function'){
                const interrupt = cb ("before",args);
                if (!interrupt) {
                  const result = res[prop].apply(res,args);
                  cb ("after", result);
                  return result;
                } else {
                    return interrupt.result;
                }
                
            } else {
                req.__zedd.log('resProxy.'+prop+'(',arguments,') called by',req.url);
                return res[prop].apply(res,args);
            }
        }
        
    }
    
    function resProxy(meth,req,res,imp,verbose) {
         const self = imp||{};
         
         const handler = {
           get: function(obj, prop, receiver) {
               const asked_for = res[prop];
               const instead = self[prop];
               if (verbose)
               req.__zedd.log(prop,'accessed in '+meth+'ResProxy, returning', typeof asked_for);
               return instead||asked_for;
           },
           set : function (obj, prop, value) {
                if (verbose)
                   req.__zedd.log(prop,'modified in '+meth+'ResProxy:',typeof value);
                res[prop] = value;    
                return true;
           }
         };
        return  new Proxy(self, handler);
    }
    

    function getResProxy(req,res) {
       var hasher,more=false,count;

     
       const proxy = resProxy('get',req,res,{
            //emit accessed in getResProxy, returning function
            emit : functionCloner (req,res,'emit',function(mode,args){
                
                
                switch (mode+args[0]) {
                    case 'beforepipe': {
                           
                        const data = hashes[req.url];
                        if (data && data.etag  && data.sha1) {
                            // this file was previously hashed, and file time/size has not changed
                            // presume the sha1 is stil valid
                            if ( data.etag === res.getHeader('etag') &&
                                 data.length === res.getHeader('content-length') ) {
                                res.setHeader(X_SHA1_Header,data.sha1);
                                res.setHeader(X_ContentLength,data.length);
                                req.__zedd.log("sent augmented head in GET",req.url);
                                     
                            }
                        }
                        
                        // regardless we hash it on the way out.
             
       
                        count = 0;
                        hasher = crypto.createHash('sha1');
                        break;
                    }
                    case 'afterpipe': {
                        more = args;
                        break;
                    }
                    case 'afterunpipe' : {
                        hashes[req.url]= {
                            sha1:hasher.digest('hex'),
                            length:res.getHeader('content-length'),
                            etag:res.getHeader('etag')
                        };
                        hasher=undefined;
                        break;
                    }
                //    default :
                   // req.__zedd.log(mode+args[0]); 
                }
 
            }),
            //_implicitHeader accessed in getResProxy, returning function
            //on accessed in getResProxy, returning function
           // on : functionCloner(req,res,'on'),
            //once accessed in getResProxy, returning function
           // once : functionCloner (req,res,'once'), 
            //_onPendingData accessed in getResProxy, returning function
            //prependListener accessed in getResProxy, returning function
            //_send accessed in getResProxy, returning function
            //_send : functionCloner (req,res,'_send'),
            //setHeader accessed in getResProxy, returning function
        /*    setHeader : functionCloner (req,res,'setHeader',function(mode,args){
                 
                switch (mode) {
                    case 'before':
                        switch (args[0].toLowerCase()) {
                            case 'etag': {
                                etag = args[1];
                                
                                const data = hashes[req.url];
                                if (data && data.etag  && data.sha1) {
                                    if (data.etag === args[1]) {
                                        can_augment=data;
                                    }
                                }
                                
                                break;
                            }
                            case 'content-length': contentLength = args[1];break;
                        }
                        break;
                }
            }),*/
            //_storeHeader accessed in getResProxy, returning function
            //write accessed in getResProxy, returning function
            write : functionCloner (req,res,'write',function(mode,args){
                
                
                  
                switch (mode) {
                    case 'before': {
                        if (hasher) {
                            hasher.update(args[0]);
                            count+=args[0].length;
                            if (!more) {
                                hashes[req.url]= {
                                    sha1:hasher.digest('hex'),
                                    length:res.getHeader('content-length'),
                                    etag:res.getHeader('etag')
                                };
                                hasher=undefined;
                            }
                        } else {
                            req.__zedd.log('write called without hasher');
                        }
                        break;
                    }
                }
            }),
            //writeHead accessed in getResProxy, returning function
            
          //  writeHead : functionCloner (req,res,'writeHead'),
            //_writeRaw accessed in getResProxy, returning function
           // _writeRaw : functionCloner (req,res,'_writeRaw')
       });
       
     
       return proxy;
       
    }
    
    function headResProxy(req,res) {
        var can_augment=false;
        return resProxy('head',req,res,{
            setHeader : functionCloner(req,res,'setHeader',function(mode,args){
                      
                    switch (mode) {
                        case 'before': {
                            if (args[0].toLowerCase()==='etag') {
                                const data = hashes[req.url];
                                
                                if (data && data.etag  && data.sha1) {
                                    if (data.etag === args[1]) {
                                        can_augment=data;
                                    }
                                }
                                
                               
                            }
                            break;
                        }            
                    }
                 
                 
            }),
            end : functionCloner(req,res,'end',function(mode,args){
                if (can_augment) {
                    
                    switch (mode) {
                        case 'before': {
                                          
                            req.__zedd.log({augmenting:can_augment});
                            res.setHeader(X_SHA1_Header,can_augment.sha1);
                            res.setHeader(X_ContentLength,can_augment.length);
                            
                            break;
                        }            
                    }
                 
                }
            }),
                
                
                
  
             

        });
    }

    function GET(req, res) {
        req.__zedd.log('Zedd enhanced GET:', req.url);
        return standardRequestHandler(req, getResProxy(req,res));
    }

    function PUT(req, res) {
        req.__zedd.log('Zedd enhanced PUT:', req.url);
        return standardRequestHandler(req, res);
    }
    
    
    
    function bufferPatchRequest(req, res, callback) {
        var buffers = [],
            bytes=0,
            wipe = function(){buffers.splice(0,buffers.length);},
            getPatch = function(){ 
                const res = Buffer.concat(buffers).toString('utf8');
                wipe();
                return res; 
                
            };
        req.on("data", function(data) {
            buffers.push(data);
            bytes+=data.length;
            if (bytes > 1e6) {
                wipe();
                res.writeHead(413, {
                    "Content-Type": "text/plain"
                });
                req.connection.destroy();
            }
        });
        req.on("end", function() {
            const patch = getPatch();
            console.log(patch);
            req.patch = JSON.parse(patch);
            callback();
        });
    }
        
     function PATCH(req,res){
         req.__zedd.log('Zedd enhanced PATCH:', req.url);
         bufferPatchRequest (req,res,function(){
             
             
             const filePath = path.normalize(path.join(ROOT, req.url));
             const apply = function() {
                 return apply_diff(
                     hashes[req.url].data,
                     req.patch.diff,
                     function(new_data,hash){
                     if (new_data) {
                         fs.writeFile(filePath,new_data,function(){
                             const json = JSON.stringify({
                                        ok: req.patch[2]
                                    });
                             res.writeHead(200, "OK", {
                                 'Content-Type': 'application/json',
                                 'Content-Length': json.length
                             });
                             res.end(json);
                         });
                     }
                 });
             }
 
             if (filePath.indexOf(ROOT) !== 0) {
                 return httpError(res, 500, "Hack attempt?");
             }
             
             fs.stat(filePath, function(err, stat) {
                 if (err) {
                     return httpError(res, 404, "Path not found");
                 }
                 if (hashes[req.url]) {
                     
                     if (hashes[req.url].data) {
                         return apply();
                     }
                 }
                 fs.readFile(filePath,'utf8',function(err,data){
                     if (err) {
                         
                         return httpError(res, 500, "Can't read file");
                          
                     }
                     hashes[req.url].data=data;
                     return apply();
                 });
     
             });
         });
     }


    function POST(req, res) {
        req.__zedd.log('Zedd enhanced POST:', req.url);
        return standardRequestHandler(req, res);
    
    }

    function DELETE(req, res) {
      req.__zedd.log('Zedd enhanced DELETE:', req.url);
        return standardRequestHandler(req, res);
    }

    function HEAD(req, res) {
      //  req.__zedd.log('Zedd enhanced HEAD:', req.url);
        if (hashes[req.url]) {
            res.setHeader(X_SHA1_Header,hashes[req.url].sha1);
            res.setHeader(X_ContentLength,hashes[req.url].length);
        //   return standardRequestHandler(req, headResProxy(req,res));
        }// else 
           return standardRequestHandler(req, res);
    }
    
 
 

}
