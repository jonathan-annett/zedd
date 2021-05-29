try {

 const 
 
 fs = require("fs"), 
 crypto = require('crypto'),
 secureJSON=require("glitch-secure-json"),
 config = secureJSON.parse(fs.readFileSync("./keys.json")),
 zcfg = JSON.parse(fs.readFileSync("./zedd.json")),
 
 seeds = Buffer.from(JSON.stringify([config.aux.nonce1,config.aux.nonce2,config.aux.nonce3,config.aux.nonce4])),
    
    hash1 = crypto.createHash('sha256').update(
    Buffer.concat([seeds,Buffer.from(config.aux.pass1)])
    ).digest('base64').replace(/\=/g,''),
       
    hash2 = crypto.createHash('sha256').update(
    Buffer.concat([seeds,Buffer.from(config.aux.pass2)])
    ).digest('base64').replace(/\=/g,'');
    
    
    console.log(JSON.stringify({
       url: "https://"+config.domain+":"+zcfg.port+"/",
       auth:{
       user : hash1,
       pass : config.aux.pass2 
    }},undefined,4)); 
    
    config.aux.pass1=hash1;
    config.aux.pass2=hash2;
    delete config.aux.pass3;
    delete config.aux.pass4;

    fs.writeFileSync("./keys.json",secureJSON.stringify(config));
    
    
} catch (e) {
    console.log(e);
}
