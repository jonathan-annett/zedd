# zedd

a repackaged version of the zedd remote daemon for [ZED] (https://github.com/zedapp/zed)

based on [original code](https://github.com/zedapp/zed/tree/master/zedd) by [Zef Hemel](https://github.com/zedapp/zed/commits?author=zefhemel)

extra features

  - wrapper for lets encrypt certbot
  - runs in a sandboxed chroot environment, managed by pm2
  - stores certs in a secureJSON file
  - uses autogenerated hashed username and password, you can make a new one every day if you want
  - works against original ZED client.
 

installation
===

first, check out the [live demo](https://glitch.com/edit/#!/humdrum-successful-park?path=README.md%3A1%3A0) on glitch.

to roll your own, on your own server, it's a little more involved, as you need ssl certs.

thankfully there's letsencrypt.

feel free to read [install.sh](https://github.com/jonathan-annett/zedd/blob/115e3e6f3cb0021fe80331dce466c08b764f5cf3/install.sh#L1)
and enter commands manually, as this assumes your system has nothing installed.

The script will check if have git installed, and download it if you don't, just in case you downloaded and extracted these files from a zip. It also checks to see if you have zip/unzip, in case you used git! 

so you may not need the first line, if you aleady have the files in a folder.

```bash
cd ~

git clone https://github.com/jonathan-annett/zedd.git
cd zedd
chmod 755 install.sh
# use your actual domain name and email address, don't put a leading www.
# also the port and zedd (username) are the defaults. you can leave them off if you like
sudo ./install.sh example.com me@gmail.com 17377 zedd
```

  * if you don't specify a port, 17337 will be used
  * if you don't sepcify a username, zedd will be used
  * important - don't use use an existing username, unless you want it's account overwritten
  * the zedd user will run the server process and live in a sandbox, with restricted permssions
  
