var exec = require('child_process').exec;
var fs = require('fs');
var connectVPN = require('./connectVpn.js');
var clickads = require('./clickads.js');
var logger = require('./logger.js');

const MAX_NODES = 1;
const START_NODE_INTERVAL = 10000;
const CHECK_NODE_INTERVAL = START_NODE_INTERVAL * MAX_NODES;
const CONNECTION_TIMEOUT = 60000;
const MAX_VIEWS_BY_IP = 10;

var count = MAX_NODES;
var sharedObj = {clickAdsReady:false,isReady:false};


var initJob = setTimeout(init);

function restart(){
	setClickAdsReady(false)
	logger.log('main.js:[!!!!!!] restartando.......')
	clearTimeout(initJob);
	initJob = setTimeout(init);
}

function init() {
	fs.writeFileSync('var/qtd.var',"0");
	sharedObj.isReady = false;
	connectVPN.init({onComplete:initMain})
	setTimeout(function(){
		
		if(sharedObj.isReady === false) {

			logger.log("main.js:$ timeout")
			restart();
		}

	},CONNECTION_TIMEOUT);
}
function setClickAdsReady(boolean) {
	sharedObj.clickAdsReady = boolean;
	fs.writeFileSync('clickAdsReady.var',boolean ? 1 : 0);
}
function initMain(){
	setClickAdsReady(true)
	sharedObj.isReady = true;
	var spawn = require('child_process').spawn;
    var child = spawn('nodejs', ['clickads.js']);

    child.stdout.on('data', 
    	function (buffer) { 
    		logger.log(buffer.toString()) 
    });	

    child.stdout.on('error',function(buffer){
    	child.exit();
		logger.log('main.js:[!!!!!!!!!!!!!!!] Error no processo')
		restart();
    })
    setTimeout(function(){
		console.log('$ tempo máximo alcançado')
		restart();

	},CONNECTION_TIMEOUT*5);
}

setInterval(function(){

	var x = parseInt(fs.readFileSync('var/qtd.var',{encoding:'utf8'})) || 0;
	if(x > MAX_VIEWS_BY_IP){
			logger.log("main.js:[!] Mudando de ip...")
			restart();
	}


},1000)