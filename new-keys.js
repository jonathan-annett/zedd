  const 
     fs = require("fs"), 
     path = require("path"),
     crypto = require("crypto"),
     secureJSON=require("glitch-secure-json"),

     removeUnwantedBase64Chars =  /(\/|\=|\+)/g;


function makeNewPassword(config) {
 
  config.aux =  require(path.join(
        path.dirname(require.resolve("server-startup")),
        "genpass"
      )).auxPasswords(2);
 
  const 
    seeds = Buffer.from(
      JSON.stringify([
        config.aux.nonce1,
        config.aux.nonce2,
        config.aux.nonce3,
        config.aux.nonce4
      ])
    ),
 rehash = function(input){
    return crypto.createHash("sha256")
    .update(Buffer.concat([seeds, Buffer.from(input)]))
    .digest("base64")
    .replace(removeUnwantedBase64Chars, "");
  };

  config.aux.pass1 = rehash(config.aux.pass1);
  const zeddpass   = rehash(config.aux.pass2);
  config.aux.pass2 = rehash(zeddpass);
  return zeddpass;
}

function cmdLine(key_filename,app_path) {

 
 
 app_path = app_path || path.dirname( process.mainModule.filename );
     
 key_filename = key_filename || app_path+"/keys.json";
 
 zcfg_filename = app_path+"/zedd.json";
 
 
    try {

     const 

 
     config = secureJSON.parse(fs.readFileSync(key_filename)),
     zcfg = JSON.parse(fs.readFileSync(zcfg_filename)),
     zeddpass =  makeNewPassword(config);

       console.log(JSON.stringify({
          url: "https://"+config.domain+":"+zcfg.port+"/",
          auth: {
          user : config.aux.pass1,
          pass : zeddpass
       }},undefined,4)); 

     fs.writeFileSync(key_filename,secureJSON.stringify(config));

    } catch (e) {
        console.log(e);
    }
}


if (process.mainModule && process.mainModule.filename === __filename) {
   cmdLine ("./keys.json",".");
} else {
   module.exports = {
      makeNewPassword : makeNewPassword,
      removeUnwantedBase64Chars : removeUnwantedBase64Chars,
      cmdLine : cmdLine 
   };
}
