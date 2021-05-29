#!/bin/bash
if [ "$(whoami)" != "root" ] ; then
   echo "try that again, with sudo, for example:"
   echo "  sudo $0 $@"
   exit 0;
fi
HERE=$(realpath $(dirname $0))
DOMAIN="$1"
EMAIL="$2"
ZEDD_PORT="$3"
ZEDD_USER="$4"

if [[ "$ZEDD_USER" == "" ]]; then
  ZEDD_USER=zedd
fi

if [[ "$PORT" == "" ]]; then
  ZEDD_PORT="17337"
fi

if [[ "$EMAIL" == "" ]] ||  [[ "$DOMAIN" == "" ]]; then
  echo "usage: $0 domain email [ port ] [ zedduser ]"
  echo "  note..."
  echo " this installer assumes you are running this script on the machine that will act as the server"
  echo " and that you own the domain name, which is currently pointing at it's network ip"
  echo " the script will - download certbot, get a certificate via let's encrypt, download dependancies, and setup zedd."
  echo " it is assumed port 80 is available for this, so stop any http servers you have running first"
  echo " alternatively, if you already have certificates you can edit the keys.json file to point directly at the files."
  echo ""
  echo " if you don't specify a port, 17337 will be used"
  echo " if you don't sepcify a username, zedd will be used"
  echo " important - don't use use an existing username, unless you want it's account overwritten"
  echo " the zedd user will run the server process and live in a sandbox, with restricted permssions"
  echo ""
  
fi
HTTP_RUNNING=0
[[ which nc >/dev/null ]] && nc -z localhost 80 && HTTP_RUNNING=1

if [[ "$HTTP_RUNNING" == "1" ]]; then 
   echo ""
   echo "Aborting - it looks like you have a service running on port 80"
   echo ""
   exit 1
fi

function update_system() {

  cd ${HERE}
  
  

  apt-get update
  apt-get install -y jq git zip unzip certbot

  curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n

  bash n lts
  npm install -g n
  n 12.0
  rm /root/n

  npm install -g pm2
  
  cd ${HERE}
  
  git clone https://github.com/jonathan-annett/chroot-node-app.git
  
  cd chroot-node-app
  
  chmod 755  ./install.sh
  ./install.sh
  

}

function create_certs() {
  EMAIL="$1"
  DOMAIN="$2"
  
  certbot \
     certonly \
    --standalone \
    --preferred-challenges http \
    --non-interactive \
    --agree-tos \
    -m ${EMAIL} \
    -d ${DOMAIN} \
    -d www.${DOMAIN} 
 }
 
 update_system
 
 create_certs
 
 cd ${HERE}
 
 mkdir make_keyjson
 cd make_keyjson
 cat <<JSON > package.json
 {
  "name": "keys-json",
  "version": "0.0.1",
  "description": "nothing special",
  "main": "make-keys.js",
  "dependencies": {
    "express": "^4.17.1",
    "bufferutil": "^4.0.1",
    "server-startup": "github:jonathan-annett/server-startup#4c7b25a20bd5370d94a3dc6f1e7a7cd8768ad478"
  },
  "engines": {
    "node": "12.x"
  },
  "license": "MIT",
  "keywords": ["installer"]
}
JSON

#a useless server, but it will create a keys.js for it.
cat <<JS >make-keys.js
require("server-startup")(function (express,server) {
  return express();
  return app;
} );
JS 

npm install 

#run make.js, expecting it to fail due to no certs, it will create keys.js  
node ./make-keys.js || echo "ready to create keys..."

#run keys.js once to generate a key for secureJSON (aborts after that)

node ./keys.js ${DOMAIN} $HERE/keys.json 

#run keys.js again to make the actual keys.json file

node ./keys.js ${DOMAIN} $HERE/keys.json 

cd ${HERE}

#make a new set of keys for zedd  

node ./new-keys.js > ./initial-passwords-please-change.json

cd ..

make-chroot-jail $ZEDD_USER $HERE && ${ZEDD_USER}_cli node ./new-keys.js && ${ZEDD_USER}_install &&  ${ZEDD_USER}_logs


