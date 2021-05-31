#!/bin/bash
if [ "$(whoami)" == "root" ] ; then
   echo "try that again, without sudo"
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
  exit 0
fi
HTTP_RUNNING=0
which nc >/dev/null && nc -z localhost 80 && HTTP_RUNNING=1

if [[ "$HTTP_RUNNING" == "1" ]]; then 
   echo ""
   echo "Aborting - it looks like you have a service running on port 80"
   echo ""
   exit 1
fi

APT_UPDATED=no
do_apt_get () {
  which $1 >/dev/null && return 0
  [[ "$APT_UPDATED" == "yes" ]] || sudo apt-get update
  APT_UPDATED=yes
  sudo apt-install -y $2
}

update_system() {

  cd ${HERE}
  
  
  do_apt_get git git
  do_apt_get jq jq
  do_apt_get zip zip
  do_apt_get unzip unzip
  if sudo ls /etc/letsencrypt/live/${DOMAIN}/cert.pem | grep  $DOMAIN -qs ; then
     echo skipping certbot install check - certs exist
  else
     do_apt_get certbot certbot
  fi

  if which node 2>/dev/null  ; then 
    echo using existing node
  else
     curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o ${HERE}/n
     cd ${HERE}
     sudo bash n lts
     sudo npm install -g n
     n 12.0
     rm ${HERE}/n
  fi

  which pm2 || sudo npm install -g pm2
  
  cd ${HERE}
  
  git clone https://github.com/jonathan-annett/chroot-node-app.git
  
  cd chroot-node-app
  
  chmod 755  ./install.sh
  
  sudo ./install.sh
  
  ls -al 
  
  cd ${HERE}

}

 create_certs() {
  if sudo ls /etc/letsencrypt/live/${DOMAIN}/cert.pem | grep  $DOMAIN -qs; then
     echo skipping certbot download
  else
  
  sudo certbot \
     certonly \
    --standalone \
    --preferred-challenges http \
    --non-interactive \
    --agree-tos \
    -m "${EMAIL}" \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" 
    
  fi
 }
 
 update_system
 
 create_certs
 
 cd ${HERE}
 
 mkdir -p make_keyjson/node_modules
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
    "server-startup": "github:jonathan-annett/server-startup#8987ec8c9b88c8ff87e84f9f310eed52047ed25a"
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

sudo node ./keys.js ${DOMAIN} $HERE/keys.json 

#run keys.js again to make the actual keys.json file

sudo node ./keys.js ${DOMAIN} $HERE/keys.json 

sudo mv .env ${HERE}/.env

cd ${HERE}

#make a new set of keys for zedd  

npm install
node ./new-keys.js > ./initial-passwords-please-change.json


cat <<JSON  > zedd.json
{
  "tls-key":"keys.json",
  "port" : $ZEDD_PORT,
  "root" : "/public",
  "remote": true,
  "ip":"0.0.0.0"
}
JSON
cd ..
  
ls -al `which make-chroot-jail`
sudo make-chroot-jail $ZEDD_USER $HERE && ${ZEDD_USER}_cli node ./new-keys.js && ${ZEDD_USER}_install &&  ${ZEDD_USER}_logs


