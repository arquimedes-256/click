pkill -o nodejs;
pkill -o bash;
mkdir -p var;
sleep 1;
echo '0'	> var/clickAdsReady.var
echo "{}"	> var/WTFObject.json;
cd /root/click;
git pull origin master;
nodejs main.js || bash init.sh
