
module.exports  = {
    objectFunctionShim,
    bufferBodyRequest,
    proxyRequestBody,
    proxyResponseWrite
};




 const cpArgs = Array.prototype.slice.call.bind (Array.prototype.slice);
            

       
function objectFunctionShim(obj,nm,fn) {
    const inherited = obj[nm];
    var removed = false;
    if (typeof inherited==='function'&& typeof fn==='function') {
        
        obj["__remove_"+nm]=function(){
            obj[nm]=inherited;
            removed=true;
            delete obj["__remove_"+nm];
        };
        
        obj[nm]=function(){
          const args=cpArgs(arguments);
          var retval = inherited.apply(obj,args);
          if (removed) return retval;
          return retval;
        };
        
    }
    return obj;
}


  // buffers body into an array of buffers, then calls callback
  // objName : a string = concatenate the buffers, parse them as JSON, and save into req[objName]
  //           false    = just save the buffers in req.bodyBuffers
  //        undefined   = default eg (req,res,callback) = concatenate the buffers and save as req.bodyBuffer
  function bufferBodyRequest(req, res, objName, callback) {
      if (typeof objName==='function') {callback=objName;objName=undefined;}
      var buffers = [],
          bytes=0,
          wipe = function(){buffers.splice(0,buffers.length);},
          getBody = function(){ 
              const res = Buffer.concat(buffers);
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
          
          if (objName) {
              try {
                 req[objName] = JSON.parse(getBody());
              } catch (e)  {
                 req[objName] = null;
                 req[objName+"_error"]=e;
              }
          } else {
              if (objName===false){
                 req.bodyBuffers = buffers;
              } else {
                 req.bodyBuffer  = getBody();
              }
          }
          callback();
      });
  }
  
  
  
  // creates a fake request object that can be passed to a handler
  // will allow the handler to read in the body itself using the data/end events
  // but will eavesdrop and emit shadow __data and __end events, with the __end event also supplying acomplete array of the entire body
  // note - after the __end event returns, the buffer array will be spliced to an empty array , so take a 
  // slice if you intend to keep them in the array format
  
  // alternate use case - pass a string as req, representing a url (eg "/rest/api/whatever)
  // supply an array of buffers (can be a single buffer in an array) and it will simulate a POST/PUT
  // eg proxyRequestBody("/api",[Buffer.from('{"cmd":"something"}')],{method:'PATCH',headers:{'x-abc':'yes'}});
  function proxyRequestBody(req,withChunks,opts){
      
      var self = {},chunks=[];
      var events = {
         data  : [],
         error : [],
         end   : [],
         
         __data : [],
         __error : [],
         __end : [],
         
      };
      
      req = typeof req==='string' ? { 
          url : req, 
          connection: {destroy: function(){}  },
          on  : function(){
              // 
          }
          
      } : req;
      
      Object.setProperties(self, {
             
          url : {
             get : function (){ return req.url;},
             set : function (u){ req.url = u;}
          },
          
          method : {
              get : function () {
                  return opts&&opts.method ? opts.method : req && req.method ? req.method : "POST";  
              },
              
          },
          
          headers : {
            
            get : function () {
                if (opts &&opts.headers) {
                    if (!opts._headers) {
                        const hdrs = opts.headers;
                        opts.headers = {};
                        Object.keys(hdrs).forEach(function(k){
                            opts.headers[k.toLowerCase()]=hdrs[k];
                            delete hdrs[k];
                        });
                        opts._headers=true;
                    }
                    return opts.headers;
                } else {
                   return req && req.headers ? req.headers : {};
                }
            },
            
              
          },
          
          on : {
              
              value : function (ev,fn) {
                  const evs = events[ev];
                  if (typeof fn==='function'&&Array.isArray(evs)) {
                      evs.push(fn);
                      if (events.end.length && events.data.length && Array.isArray(withChunks)) {
                          withChunks.forEach(onChunk);
                          withChunks=undefined;
                          onLastChunk();
                      }
                  }
              },
              enumerable:false
          },
          emit : {
              
              value : function (ev,msg) {
                  const evs = events[ev];
                  if (Array.isArray(evs)) {
                      evs.some(function(fn){fn(msg);});
                  }
              },
              enumerable:false
          },
          
          
          connection : {
              get : function () {
                  
                  return req.connection;
              }  
          },
          
          pipe :  {
              
              
              get function () {
                 var 
                 pipeOut,
                 cb,
                 writeCB = function (pipe,CB) {
                     if (typeof CB==='function')cb=CB;
                     if (typeof pipe==='object' ) {
                         pipeOut=pipe;
                     }
                     if (chunks.length===0) {
                         if (typeof cb==='function') cb();
                     } else {
                         if (typeof pipe==='object' && pipeOut.write() ) {
                             pipeOut.write(chunks.shift(),writeCB);
                         }
                     }
                 };
                 return writeCB;
              }
          }
      });
      
     
      req.on("data",onChunk);
      req.on("error",onChunkError);
      req.on("end", onLastChunk);
      
      function onChunkError(error) {
          self.emit('error',error);
      }
      
      
      function onChunk(chunk) {
          chunks.push(chunk);
          self.emit('data',chunk);
      }
      
      function onLastChunk(chunk) {
          if (chunk) chunks.push(chunk);
          self.emit('end',chunk);
          
          self.emit('__end',[chunk,chunks]);
          
          
          Object.keys(events).forEach(function(e){
              events[e].splice(0,events[e].length);
              delete events[e];
          });
          chunks.splice(0,chunks.length);
      }
     
      
     return self;
  }

  
  // shims
  function proxyResponseWrite(res) {
      var
       
      resHeaders = {},
      chunks = [],
      self = {
            headers : resHeaders,
            chunks  : chunks,
            res : res
       };
  
      objectFunctionShim(res,"setHeader",function(obj,args,retval){
          const [name, value] = args;
          resHeaders[name] = value;
      });
      
      objectFunctionShim(res,"write",function(obj,args,retval){
          chunks.push(args[0]);
      });
      
      objectFunctionShim(res,"writeHead",function(obj,args,retval){
          var [statusCode, statusMessage, headers] = args;
          
          if (typeof statusMessage === 'object') {
              headers = statusMessage;
              statusMessage = undefined;
          }
          if (typeof headers === 'object') {
              Object.keys(headers).forEach(function(k) {
                  resHeaders[k] = headers[k];
              });
          }
      });
      
      objectFunctionShim(res,"end",function(obj,args,retval){
          if (args[0]) chunks.push(args[0]);
          if (self.onBuffer) {
              self.onBuffer(Buffer.concat(chunks));
          }
          if (self.onChunks) {
              self.onChunks(chunks);
          }
          if (self.onBuffer || self.onChunks) {
          }
         chunks.splice(0,chunks.length);
         obj.__remove_writeHead();
         obj.__remove_write();
         obj.__remove_setHeader();
         obj.__remove_end();
      });

      return self;
  }