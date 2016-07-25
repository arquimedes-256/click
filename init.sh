#init-script
pkill -o nodejs;
pkill -o bash;
mkdir -p var;
sleep 1;
echo '0'	> var/clickAdsReady.var
echo "{}"	> var/WTFObject.json;
cd /root/click;
git pull --no-edit origin master;
nodejs main.js
bash init.sh
