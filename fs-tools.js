module.exports = {
    fs_make_path_for_sync,
    fs_writeFileSync,
    fs_make_path_for,
    fs_writeFile,
    fs_statSync,
    fs_stat,
    fs_atmomicReplace
};


const fs = require('fs');
var crypto = require("crypto");
var pathlib = require("path");
var urllib = require("url");
var mime = require("mime");


function fs_make_path_for_sync(filename,mkdir) {
    
    if (typeof filename!=='string' || filename==='/' || !filename.startsWith('/')) throw new Error("can't create path");
    
    const dirname = pathlib.dirname(filename);
    
    const stat = fs.existsSync(filename)?fs.statSync(filename):undefined;

       if (!stat) {
           
            fs_make_path_for_sync(dirname,true);
           
           if (mkdir) {
                   fs.mkdirSync(filename);
           } else {
               // only gers invoked in outer loop - ie file/dir did not exist
              return {dirname:dirname,exists:false,isDir:false};
           }
           
       } else {
           
           if (!mkdir) {
               // oonly gets invoked in outer loop - ie path exists and if it is a directory
               return {dirname,exists:true,isDir:stat.isDirectory()};
           }
       }
           
    
}

function fs_writeFileSync(filename,data){ 
       
       if (typeof filename==='string') {
           if (typeof data==='string'||Buffer.isBuffer(data)) {
               
               const results = fs_make_path_for_sync(filename);
               if (results.isdir) {
                   throw (new Error(filename+" exists and is a directory"));
               }
               
               return fs.writeFileSync(filename,data);
           
           }
       } 
       
       throw new Error ('incorrect argument types');
       
   }


function fs_make_path_for(filename,cb,mkdir) {
    
    if (typeof filename!=='string' || filename==='/' || !filename.startsWith('/')) return cb(new Error("can't create path"));
    
    const dirname = pathlib.dirname(filename);
    fs.stat(filename,function(err,stat){
       
       
       if (!stat) {
           fs_make_path_for(dirname,function(err){
               if (err) return cb (err);
               if (mkdir) {
                   fs.mkdir(filename,cb);
               } else {
                   // only gers invoked in outer loop - ie file/dir did not exist
                  return cb (undefined,dirname,false,false);
               }
           },true);
       } else {
           if (!mkdir) {
               // oonly gets invoked in outer loop - ie path exists and if it is a directory
               return cb (undefined,dirname,true,stat.isDirectory())  ;
           } else {
               cb();
           }
       }
           
    });
}


function fs_writeFile(filename,data,cb){ 
    
    if (typeof filename+typeof cb==='stringfunction') {
        if (typeof data==='string'||Buffer.isBuffer(data)) {
            fs_make_path_for(filename,function(err,dn,exists,isdir){
                if (err) return cb(err);
                if (isdir) {
                    return cb(new Error(filename+" exists and is a directory"));
                }
                return fs.writeFile(filename,data,cb);
            });
        }
    } 
    
    throw new Error ('incorrect argument types');
    
}

 function fs_statSync(filename,stat,realpath) {
    
   if (!stat) stat = fs.statSync(filename);
   stat.realpath = realpath || fs.realpathSync(filename);
   stat.path = pathlib.resolve(filename);
   stat.basename = pathlib.basename(stat.path);
   stat.realbasename = pathlib.basename(stat.realpath);
   stat.id_hash = crypto.createHash("sha1").update(filename).digest("hex");
   stat.isSymbolicLink = function() {
       return (stat.path!==stat.realpath);
   };
   return stat;
}


function fs_stat(filename,cb){
    fs.stat(filename,function(err,stat){
       if (err) return cb(err);
       fs.realpath(filename,function(err,realpath){
        cb(undefined,fs_statSync(filename,stat,realpath));    
       });
    });
}

function getFileVersion (filename,cb) {
    
    
    switch (typeof filename+typeof cb) {
        case 'stringfunction' : fs_stat(filename,function(err,stat){
            if (err) return cb(err);
            if (stat.isSymbolicLink()) {
                return cb (err,stat.realbasename.split('.')[0]);
            } else {

            }
        });
    }
    
    
}

  
// 1 - won't change file it currently has same data
// 2 - returns current contents as buffer
// 3 - if differnt, return sha1 hash of each
// 4 - you can optionally supply hash for current data, to save rehashing
// 5 - if swap is true: if destfile exists, on return, transit file
//     will contain the previous contents of destfile, and  destfile will contain the passed in data
//     if transsit file existed it's contents are returned to caller
//     (also if tranist happens to already have the data being written, it will just be renamed to overwite 
//     destfile, then it will be resaved with the original contents of destfile, assuming it existed)
function fs_atmomicReplace (
    destFilename,    /* this is the file we are writing "data"" to */
    transitFilename, /* this is the file that's used to do the atomic write/swap */
    data,            /* this is the data being written to destFilename */
    hash,            /* this is the hash of the data being written (optional, will hash it if not supplied )*/
    swap,            /* forces transitFilename to persist after the operation, and it will contain whatever 
                        was in destfile before the process began (eg good for a backup file)*/
    cb ) {/* (err, hash, hash_of_replaced, replaced, transithash, transitdata ) */
    
    
    if (typeof swap==='function') {
        cb=swap;
        swap=false;
    }
    
    if (typeof hash==='function') {
        cb=hash;
        hash=undefined;
        swap=false;
    }
    const source = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    if (typeof hash!=='string') {
        hash = crypto.createHash("sha1").update(source).digest("hex");
    }
    
  
    
    const phase_2 = function (transit_data,transit_hash){
    
        fs.readFile(destFilename,function(err,current_data,stat){
            
           
            if (!err && current_data) {
                
                
                if (Buffer.compare(source,current_data)===0) {
                    
                    if(swap) {
                        
                        if ( transit_hash===hash ) {
                        
                            return cb (
                                undefined,
                                hash,
                                hash,
                                current_data,
                                transit_hash,
                                transit_data);        
                        }
                        
                        fs_writeFile(transitFilename,current_data,function(err){
                            if (err) return cb(err);
                            return cb(
                                undefined,
                                hash,
                                crypto.createHash("sha1").update(current_data).digest("hex"),
                                current_data,
                                transit_hash,
                                transit_data );
                         });
                        
                         
     
                        
                    } else {
                        
                      return cb (
                          undefined,
                          hash,
                          hash,
                          current_data,
                          transit_hash,
                          transit_data );
                          
                    }
                }
                
                if (transit_hash===hash) {
                    
                    fs.rename(transitFilename,destFilename,function(){
                    if (err) return cb(err);
                    
                        if (swap) {
                            
                       fs_writeFile(transitFilename,current_data,function(err){
                            if (err) return cb(err);
                           return cb(
                           undefined,
                           hash,
                           crypto.createHash("sha1").update(current_data).digest("hex"),
                           current_data,
                           transit_data,
                           transit_hash);
                           
                        
                        
                            }); 
                                
                        } else {
                            return cb(
                                undefined,
                                hash,
                                crypto.createHash("sha1").update(current_data).digest("hex"),
                                current_data);
                                
                        }
                    });
                } else {
                    
              
                    fs_writeFile(transitFilename,source,function(err){
                        if (err) return cb(err);
                        fs.rename(transitFilename,destFilename,function(){
                            if (err) return cb(err);
                            if (swap) {
                                fs_writeFile(transitFilename,current_data,function(err){
                                    if (err) return cb(err);
                                return cb(
                                    undefined,
                                    hash,
                                    crypto.createHash("sha1").update(current_data).digest("hex"),
                                    current_data,
                                    transit_hash,
                                    transit_data
                                 );
                                });
                           } else {
                                return cb(
                                    undefined,
                                    hash,
                                    crypto.createHash("sha1").update(current_data).digest("hex"),
                                    current_data
                                );                                   
                               
                           }
                        });
                    });
                 }
                
            } else {
                
                if (transit_hash===hash) {
                    
                    fs.rename(transitFilename,destFilename,function(err){
                        if (err) return cb(err);
                        if (swap) {
                            fs_writeFile(transitFilename,transit_data,function(err){
                                if (err) return cb(err);
                                return cb(undefined,hash,undefined,undefined,transit_data,transit_hash) ;
                            });
                        } else {
                           return cb(undefined,hash);
                        }
                    });
                    
                } else {
                    
                    fs_writeFile(transitFilename,source,function(err){
                        if (err) return cb(err);
                        fs.rename(transitFilename,destFilename,function(err){
                            if (err) return cb(err);
                            
                                fs_writeFile(transitFilename,transit_data,function(err){
                                    if (err) return cb(err);
                                    return cb(undefined,hash,undefined,undefined,transit_data,transit_hash) ;
                                });
                           
                        });
                    });
                
                }
                
            }
            
        });
    
    };
    
    if (swap) {
        fs.readFile(transitFilename,function(err,data){
            // if no previous transit data, just, proceed without it 
            if (err) return phase_2();
            phase_2(data,crypto.createHash("sha1").update(data).digest("hex"));
        });
    } else {
        
        phase_2();
    }
    
}

  
