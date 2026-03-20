#!/bin/bash
sshpass -p 'Umesh@2003##' ssh -o StrictHostKeyChecking=no root@151.243.146.192 << 'REMOTE_COMMANDS'
  echo "Connected to VPS!"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs git
  npm install -g pm2
  rm -rf /var/www/docuploadingportal
  mkdir -p /var/www
  cd /var/www
  git clone https://github.com/umeshkumar097/docuploadingportal.git
  cd docuploadingportal
  npm install
  npm run build
  pm2 start npm --name "cruxdoc" -- start
  pm2 save
  pm2 startup
  echo "Deployment Complete!"
REMOTE_COMMANDS
