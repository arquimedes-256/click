var exec = require('child_process').exec;
var fs = require('fs');

fs.writeFileSync('var/WTFObject.json', '{}');
var connectVPN = require('./connectVpn.js');
var logger = require('./logger.js');

const MAX_NODES = 1;
const START_NODE_INTERVAL = 10000;
const CHECK_NODE_INTERVAL = START_NODE_INTERVAL * MAX_NODES;
const CONNECTION_TIMEOUT = 60000;
const MAX_VIEWS_BY_IP = 3;

var count = MAX_NODES;
var sharedObj = {
	clickAdsReady: false,
	isReady: false
};


var initJob = setTimeout(init);

function restart() {
	logger.log('main.js:[!!!!!!] restartando.......')
	clearTimeout(initJob);
	initJob = setTimeout(init);
}

function init() {
	fs.writeFileSync('var/qtd.var', "0");
	setClickAdsReady(false);
	sharedObj.isReady = false;
	connectVPN.init({
		onComplete: initMain
	})
	setTimeout(function() {

		if (sharedObj.isReady === false) {

			logger.log("main.js:$ timeout")
			restart();
		}

	}, CONNECTION_TIMEOUT);
}

function setClickAdsReady(boolean) {
	sharedObj.clickAdsReady = boolean;
	fs.writeFileSync('var/clickAdsReady.var', boolean ? 1 : 0);
}

function initMain() {
	setClickAdsReady(true)
	sharedObj.isReady = true;

	execCmd('pkill -9 -f "nodejs clickads.js"');
	execCmd('pkill phantomjs');

	function nodejs_clickads() {
		var spawn = require('child_process').spawn;
		var child = spawn('nodejs', ['clickads.js']);

		child.stdout.on('data',
			function(buffer) {
				logger.log(buffer.toString())
			});

		child.stdout.on('error', function(buffer) {
			child.exit();
			logger.log('main.js:[!!!!!!!!!!!!!!!] Error no processo')
			restart();
		})
	}
	setTimeout(function() {
		var i = 0;

		while (i < 3) {
			nodejs_clickads();
			i++;
		}

		setTimeout(function() {
			console.log('$ tempo máximo alcançado')
			restart();

		}, CONNECTION_TIMEOUT * 3);
	}, 1000)
}

setInterval(function() {

	var x = parseInt(fs.readFileSync('var/qtd.var', {
		encoding: 'utf8'
	})) || 0;
	if (x > MAX_VIEWS_BY_IP) {
		logger.log("main.js:[!] Mudando de ip...")
		restart();
	}


}, 1000)

function execCmd(cmd) {
	var ret = exec(cmd, function(error, stdout, stderr) {
		console.log('$main.js: stdout', stdout);
		console.log('$main.js: stderr', stderr);
	});
}
