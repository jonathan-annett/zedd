#!/usr/bin/env node

var externalOptions;

function ZEDD(standalone) {
    var http = require("http");
    var https = require("https");
    var pathlib = require("path");
    var urllib = require("url");
    var fs = require("fs");
    var path = require("path");
    var qs = require("querystring");
    var mkdirp = require("mkdirp");
    var mime = require("mime");
    var auth = require("basic-auth");
    var nconf = require("nconf");
    var spawn = require("child_process").spawn;
    var secureJSON = require("glitch-secure-json");
    
    var base64FuglyChars =  /(\/|\=|\+)/g;


    /**
     * Options:
     * - user
     * - pass
     * - port
     * - remote
     * - enable-run
     * - root
     * - tls-key
     * - tls-cert
     */

    var config = nconf.argv().env().file(path.join(__dirname, "zedd.json")).defaults({
        port: 7337,
        ip: "0.0.0.0",
        root: process.env.HOME || "/"
    });

    if (!getUser() && getIp() === "0.0.0.0") {
        if (externalOptions) {
            externalOptions.ip = "127.0.0.1";
        } else {

            config.set("ip", "127.0.0.1");
        }
    }

    var ROOT = pathlib.resolve(getRoot());
    var enableRun = !getRemote() || getEnableRun();

    if (standalone) {
        switch (process.argv[2]) {
            case "--help":
                help();
                break;
            case "--version":
                version();
                break;
            default:
                start();
        }

    } else {

        return {
            options: setExternalOptions,
            checkUserPass:checkUserPass,
            base64FuglyChars:base64FuglyChars,
            start: function(app) {
                if (typeof app === "function") {
                    
                    if (typeof externalOptions.route==='string') {
                         const sliceFrom=externalOptions.route.length-1;
                         app.use( function (req,res,next) {
                            if (req.url.startsWith(externalOptions.route)) {
                                req.url = req.url.substr(sliceFrom);
                                return requestHandler(req,res);
                            } else {
                                return next();
                            }
                        });
                    } else {
                         if (typeof externalOptions.route==='object' && externalOptions.route.constructor===RegExp) {
                             const regExp = externalOptions.route;
                             app.use( function (req,res,next) {
                                const test = regExp.exec(req.url) 
                                if (test) {
                                    req.url = req.url.substr(test[0].length);
                                    return requestHandler(req,res);
                                } else {
                                    return next();
                                }
                            });
                        }    
                    }
                   
                    
                } else {
                  return requestHandler;   
                }
            },
            stop: function() {

            }

        }
    }

    function help() {
        console.log("Zedd is the Zed daemon used to edit files either locally or remotely using Zed.");
        console.log("Options can be passed in either as environment variables, JSON config in");
        console.log("./zedd.json or as command line arguments prefixed with '--':");
        console.log();
        console.log("   user:       username to use for authentication (default: none)");
        console.log("       pass:       password to use for authentication (default: none)");
        console.log("   remote:     bind to 0.0.0.0, requires auth, and disables");
        console.log("               enable-run by default");
        console.log("   port:       port to bind to (default: 7337)");
        console.log("   root:       root directory to expose (default: $HOME)");
        console.log("   enable-run: enable running of external programs in remote mode");
        console.log("   tls-key:    path to TLS key file (enables https)");
        console.log("   tls-cert:   path to TLS certificate file (enables https)");
        console.log();
    }

    function version() {
        console.log("Zedd version 1.0");
    }

    function error(res, code, message) {
        res.writeHead(code, {
            "Content-Type": "text/plain"
        });
        res.write(code + " " + message);
        res.end();
    }

    function sendEtagHeader(res, stat) {
        res.setHeader("ETag", stat.mtime.getTime());
    }

    function doGet(req, res, filePath) {
        fs.stat(filePath, function(err, stat) {
            if (err) {
                return error(res, 404, "Path not found");
            }

            res.statusCode = 200;
            sendEtagHeader(res, stat);
            if (stat.isDirectory()) {
                res.setHeader('Content-Type', 'text/plain');
                fs.readdir(filePath, function(err, list) {
                    list = list.forEach(function(name) {
                        try {
                            var stat = fs.statSync(filePath + "/" + name);
                            if (stat.isDirectory()) {
                                res.write(name + "/\n");
                            } else {
                                res.write(name + "\n");
                            }
                        } catch (e) {
                            // Broken symlink or something, ignore
                        }
                    });
                    res.end();
                });
            } else { // File
                res.setHeader('Content-Length', stat.size);
                res.setHeader('Content-Type', mime.lookup(filePath));
                var stream = fs.createReadStream(filePath);
                stream.on('error', function(err) {
                    console.error("Error while reading", err);
                });
                stream.pipe(res);
            }

        });
    }

    function doHead(req, res, filePath) {
        fs.stat(filePath, function(err, stat) {
            if (err) {
                return error(res, 404, "Path not found");
            }

            res.statusCode = 200;
            sendEtagHeader(res, stat);
            res.setHeader("Content-Length", "0");
            res.end("");
        });
    }

    function doPut(req, res, filePath) {
        // TODO: Make this streaming (and in that case: write to temp file first)
        var chunks = [];

        req.on("data", function(chunk) {
            chunks.push(chunk);
        });
        req.on("error", function() {
            error(res, 500, "Could't save file");
        });
        req.on("end", function() {
            var parentDir = pathlib.dirname(filePath);
            mkdirp(parentDir, function(err) {
                if (err) {
                    return error(res, 500, "Could't create parent directory");
                }
                var f = fs.createWriteStream(filePath);
                f.on('error', function() {
                    error(res, 500, "Couldn't write to file");
                });
                // Flush out all chunks
                for (var i = 0; i < chunks.length; i++) {
                    f.write(chunks[i]);
                }
                f.end();
                f.on('finish', function() {
                    fs.stat(filePath, function(err, stat) {
                        if (err) {
                            return error(res, 404, "Path not found");
                        }

                        res.statusCode = 200;
                        sendEtagHeader(res, stat);
                        res.end("OK");
                    });
                });
            });
        });
    }

    function doDelete(req, res, filePath) {
        fs.stat(filePath, function(err) {
            if (err) {
                return error(res, 404, "File not found");
            }

            fs.unlink(filePath, function(err) {
                if (err) {
                    return error(res, 404, "Unable to remove file");
                }
                res.statusCode = 200;
                res.end("OK");
            });
        });
    }

    function doPost(req, res, filePath) {
        bufferPostRequest(req, res, function() {
            var action = res.post && res.post.action;
            switch (action) {
                case "filelist":
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    fileList(filePath, res);
                    break;
                case "run":
                    if (!enableRun) {
                        return error(res, 403, "Run is disabled");
                    }
                    runCommand(filePath, res);
                    break;
                case "version":
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    res.end("1.1");
                    break;
                case "capabilities":
                    res.writeHead(200, "OK", {
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({
                        run: !! enableRun
                    }));
                    break;
                default:
                    return error(res, 404, "Unable to perform action: " + action);
            }
        });
    }

    function requestHandler(req, res) {
        var filePath = decodeURIComponent(urllib.parse(req.url).path);
        if (getUser()) {
            var user = auth(req);
            if (!checkUserPass(user)) {
                res.writeHead(401, {
                    'WWW-Authenticate': 'Basic realm="Zed daemon"'
                });
                return res.end();
            }
        }
        console.log(req.method, filePath);
        filePath = pathlib.normalize(pathlib.join(ROOT, filePath));

        if (filePath.indexOf(ROOT) !== 0) {
            return error(res, 500, "Hack attempt?");
        }

        switch (req.method) {
            case "GET":
                return doGet(req, res, filePath);
            case "HEAD":
                return doHead(req, res, filePath);
            case "PUT":
                return doPut(req, res, filePath);
            case "POST":
                return doPost(req, res, filePath);
            case "DELETE":
                return doDelete(req, res, filePath);
            default:
                return error(res, 500, "Unknown request type");
        }
    }


    function getTLSOptions() {

        if (getTLSOptions.cached) {
            return getTLSOptions.cached.value;
        }

        const keyFile = config.get("tls-key"),
        certFile = config.get("tls-cert"),
        keyExists = typeof keyFile === 'string' && fs.existsSync(keyFile),
        certExists = typeof certFile === 'string' && fs.existsSync(certFile);

        if (keyExists && certExists) {

            console.log('using', keyFile, 'and', certFile, 'for tls');
            getTLSOptions.cached = {
                value: {
                    key: fs.readFileSync(keyFile),
                    cert: fs.readFileSync(certFile)
                }
            };

            return getTLSOptions.cached.value;

        } else {
            if (keyExists && !certFile) {
                console.log('parsing', keyFile, 'for tls');
                const buf = fs.readFileSync(keyFile);
                let options = JSON.parse(buf);
                if (Array.isArray(options)) {
                    console.log(keyFile, 'appears to be secureJSON');
                    options = secureJSON.parse(buf);
                    if (options && typeof options.certs === 'object' && options.certs.key && options.certs.cert) {
                        console.log('parsed secureJSON, using for tls options');
                        delete options.certs.ca;
                        getTLSOptions.cached = {
                            value: options.certs
                        };
                        return getTLSOptions.cached.value;
                    } else {
                        console.log('could not parse secureJSON');
                    }
                } else {

                    if (typeof options === 'object' && options.key && options.cert) {

                        delete options.ca;
                        getTLSOptions.cached = {
                            value: options
                        };
                        return getTLSOptions.cached.value;
                    }
                }
            }
        }
        getTLSOptions.cached = {};
    }


    function getTLSKey() {
        if (externalOptions) {
            return externalOptions.TLSKey;
        }
        return config.get("tls-key")
    }


    function getTLSCert() {
        if (externalOptions) {
            return externalOptions.TLSCert;
        }
        return config.get("tls-cert")
    }
    
    
    function getDomain() {
        if (externalOptions) {
            return externalOptions.domain;
        }
        if (getDomain.cached) {
            return getDomain.cached.value;
        }

        const keyFile = getTLSKey(),
        certFile = getTLSCert(),
        keyExists = typeof keyFile === 'string' && fs.existsSync(keyFile);

        if (keyExists && !certFile) {
            const buf = fs.readFileSync(keyFile);
            if (Array.isArray(JSON.parse(buf))) {
                const options = secureJSON.parse(buf);
                if (options.domain) {
                    getDomain.cached = {
                        value: options.domain
                    };
                    return getDomain.cached.value;
                }
            }
        }
        getDomain.cached = {};
    }



    function getUser() {
        if (externalOptions) {
            return externalOptions.user;
        }
        if ( !! getUser.cached) {
            return getUser.cached.value;
        }
        const result = config.get("user");
        if (result) {
            getUser.cached = {
                value: result
            };
            return getUser.cached.value;
        }
        const keyFile = getTLSKey(),
        certFile = getTLSCert(),
        keyExists = typeof keyFile === 'string' && fs.existsSync(keyFile);

        if (keyExists && !certFile) {
            const buf = fs.readFileSync(keyFile);
            if (Array.isArray(JSON.parse(buf))) {
                const options = secureJSON.parse(buf);
                if (options.aux && options.aux.pass1) {
                    getUser.cached = {
                        value: options.aux.pass1
                    };
                    return getUser.cached.value;
                }
            }
        }
        getUser.cached = {};
    }

    function getPass() {
        if (externalOptions) {
            return externalOptions.pass;
        }
        return "xxxx"; //config.get("user");
    }

    function checkUserPass(user) {
        if (externalOptions && typeof externalOptions.checkUserPass === "function") {
            return externalOptions.checkUserPass(user);
        }

        const keyFile = getTLSKey(),
        certFile = getTLSCert(),
        keyExists = typeof keyFile === 'string' && fs.existsSync(keyFile);

        if (user && keyExists && !certFile) {

            const buf = fs.readFileSync(keyFile);
            if (Array.isArray(JSON.parse(buf))) {
                const aux = secureJSON.parse(buf).aux;
                return aux && aux.pass2 && (aux.pass1 === user.name) && (aux.pass2.replace(base64FuglyChars,'') === require("crypto")
                    .createHash('sha256')
                    .update(Buffer.concat([
                Buffer.from(JSON.stringify([aux.nonce1, aux.nonce2, aux.nonce3, aux.nonce4])),
                Buffer.from(user.pass)]))
                    .digest('base64').replace(base64FuglyChars,''));
            }
        }

        return false;

    }

    function getRemote() {
        if (externalOptions) {
            return externalOptions.remote;
        }
        return config.get("remote");
    }

    function getEnableRun() {
        if (externalOptions) {
            return externalOptions.enableRun;
        }
        return config.get("enable-run");
    }

    function getIp() {
        if (externalOptions) {
            return externalOptions.ip;
        }
        return config.get("ip");
    }

    function getPort() {
        if (externalOptions) {
            return externalOptions.port;
        }
        return config.get("port");
    }

    function getRoot() {
        if (externalOptions) {
            return externalOptions.root;
        }
        return config.get("root");
    }



    function start(cb) {
        var server, isSecure;
        var bindIp = getRemote() ? "0.0.0.0" : "127.0.0.1";
        var bindPort = getPort();
        if (getRemote() && !getUser()) {
            const err = "In remote mode, --user and --pass need to be specified.";
            if (standalone) {
                console.error(err);
                process.exit(1);
            } else {
                return cb(new Error(err));
            }
        }
        const tlsOptions = getTLSOptions();
        if (tlsOptions) {
            server = https.createServer(tlsOptions, requestHandler);
            isSecure = true;
            console.log("started https server using options:", Object.keys(tlsOptions));
        } else {
            server = http.createServer(requestHandler);
            console.log("started http server");
            isSecure = false;
        }
        server.listen(bindPort, bindIp);
        server.on("error", function() {
            const err = "ERROR: Could not listen on port " + bindPort + " is zedd already running?";
            if (standalone) {
                console.error(err);
                process.exit(2);
            } else {
                return cb(new Error(err));
            }

        });
        if (standalone) {
            console.log(
                "Zedd is now listening on " + (isSecure ? "https" : "http") + "://" + bindIp + ":" + bindPort,
                getDomain()?
                "\n                         "+ (isSecure ? "https" : "http") + "://" + getDomain() + ":" + bindPort : "",
                "\nExposed filesystem :", ROOT,
                "\nMode               :", getRemote() ? "remote (externally accessible)" : "local",
                "\nSecurity           :", isSecure ? "TLS certs" : "None",
                "\nCommand execution  :", enableRun ? "enabled" : "disabled",
                "\nAuthentication     :", getUser() ? "enabled" : "disabled");
        } else {
            return cb(undefined, {
                url: (isSecure ? "https" : "http") + "://" + bindIp + ":" + bindPort,
                root: ROOT,
                mode: getRemote() ? "remote (externally accessible)" : "local",
                security: isSecure ? "TLS certs" : "None",
                enableRun: enableRun,
                authentication: !! getUser()
            });
        }
    }


    function bufferPostRequest(req, res, callback) {
        var queryData = "";
        req.on("data", function(data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                res.writeHead(413, {
                    "Content-Type": "text/plain"
                });
                req.connection.destroy();
            }
        });
        req.on("end", function() {
            res.post = qs.parse(queryData);
            callback();
        });
    }

    function fileList(root, res) {
        var stop = false;

        res.on("error", function() {
            stop = true;
        });
        res.on("close", function() {
            stop = true;
        });
        walk("", function(err) {
            if (err) {
                return error(res, 500, err.message);
            }
            res.end();
        });

        function walk(dir, callback) {
            if (stop) {
                return callback();
            }
            fs.readdir(root + dir, function(err, list) {
                if (err) {
                    return callback(err);
                }
                var pending = list.length;
                if (pending === 0) {
                    return callback(null);
                }
                list.forEach(function(name) {
                    if (name === "." || name === "..") {
                        return checkDone();
                    }
                    var file = dir + '/' + name;
                    fs.stat(root + file, function(err, stat) {
                        if (stat && stat.isDirectory()) {
                            walk(file, function() {
                                checkDone();
                            });
                        } else if (stat && stat.isFile()) {
                            res.write(dir + '/' + name + "\n");
                            checkDone();
                        } else {
                            // !stat
                            checkDone();
                        }
                    });
                });

                function checkDone() {
                    if (!--pending) {
                        callback();
                    }
                }
            });
        }
    }

    function runCommand(root, res) {
        var command = res.post.command;
        if (!command) {
            return error(res, 500, "No command specified");
        }
        try {
            command = JSON.parse(command);
        } catch (e) {
            return error(res, 500, "Could not parse command");
        }
        var p = spawn(command[0], command.slice(1), {
            cwd: root,
            env: process.env
        });
        res.on("error", function() {
            console.log("Killing sub process", command[0]);
            p.kill();
        });
        res.on("close", function() {
            console.log("Killing sub process", command[0]);
            p.kill();
        });
        if (res.post.stdin) {
            p.stdin.end(res.post.stdin);
        }
        p.stdout.pipe(res);
        p.stderr.pipe(res);
        p.on("close", function() {
            res.end();
        });
        p.on("error", function(err) {
            console.error("Run error", err);
        });
    }

}

function setExternalOptions(opt) {
    externalOptions = opt;

    if (opt) {

        if (!opt.port) {
            opt.port = 7337;
        }
        if (!opt.ip) {
            opt.ip = "0.0.0.0";
        }
        if (!opt.root) {
            opt.root = process.env.HOME || require('path').ddirname(process.mailModule.filename);
        }

    }
}


if (process.mainModule.filename === __filename) {
    ZEDD(true);
} else {
    module.exports = ZEDD;
    module.exports.setOptions = setExternalOptions;
}
