var Horseman = require('node-horseman');
var _ = require('underscore')
var fs = require('fs')
var Firebase = require('firebase');
var DB = new Firebase('https://clickz.firebaseio.com/db');

var userAgentList = fs.readFileSync('user_agents', {
	encoding: 'utf8'
}).split('\n');

var deviceList = JSON.parse(fs.readFileSync('devices.json', {
	encoding: 'utf8'
}));

var currentUserAgent;
var currentWidth;
var currentHeight;
var sharedObj = {};

function setRandUserAgent() {
	currentUserAgent = _.sample(userAgentList).replace('\r', '')
	console.log('$', currentUserAgent)
}


function setViewPort() {
	var X = _.sample(deviceList)
	currentWidth = (X["Portrait Width"]);
	currentHeight = (X["Landscape Width"]);
	console.log("viewport", currentHeight, currentWidth)
}

function openAds() {
	var clickAdsReady = parseInt(fs.readFileSync('var/clickAdsReady.var', {
				encoding: 'utf8'
			})) ;
	console.log('clickAdsReady.var:',clickAdsReady)
	if(!clickAdsReady)
		return;
	var X = ["http://prpops.com/p/hhb6/direct/http://popcorn-tstudy.rhcloud.com/"]
	_open('ads',_.sample(X));
}
function _open(namespace,url){
	console.log("clickads.js:$ open")

	setRandUserAgent();
	setViewPort();
	var AdsService = new Horseman({
		loadImages: true
	});
	console.log(new Date())
	AdsService
		.viewport(currentWidth, currentHeight)
		.userAgent(currentUserAgent)
		.open(url)//"http://prpops.com/p/hhb6/direct/http://popcorn-tstudy.rhcloud.com/"
		.wait(5000)
		//.screenshot(namespace+"/" + new Date().getTime() + ".png")
		.wait(6000)
		.evaluate(function(){
			if(document.querySelector('a[href]'))
				document.querySelector('a[href]').click()
		})
		.then(function() {
			var x = parseInt(fs.readFileSync('var/qtd.var', {
				encoding: 'utf8'
			})) || 0;

			fs.writeFileSync('var/qtd.var',(x+1).toString());
			console.log('clickads.js: qtdClicados',x);
			console.log("clickads.js: finish")
			AdsService.close();

			var x = parseInt(fs.readFileSync('var/qtd.var',{encoding:'utf8'})) || 0; console.log("Qtd",x);
			fs.writeFileSync("var/qtd.var",x+1)
			openAds();
			DB.push({ dt:new Date().getTime(),userAgent:currentUserAgent })
		})
}

(exports.init = function(_mainObj){
	sharedObj = _mainObj;
	openAds();
})
exports.init({clickAdsReady:true});