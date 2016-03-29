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
var WTFObject = {};

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
	}));
	console.log('clickAdsReady.var:', clickAdsReady)
	WTFObject = JSON.parse(fs.readFileSync('var/WTFObject.json', {
		encoding: 'utf8'
	}))
	if (!clickAdsReady)
		return;
	//var X = ['http://m.urlxum.com/?login=ltgglt2&product=683&flw=5871',
	//'http://prwidgets.com/twiant.com/hzn0/1350/200/1350/200/b?prr=aHR0cDovL3BvcGNvcm4tdHN0dWR5LnJoY2xvdWQuY29tLw==',
	var AdsList = JSON.parse(fs.readFileSync('var/AdsList.json')); //, "http://prpops.com/p/hhb6/direct/http://www.amateurs-teen-blowjob.com/"];
	_open('ads', _.sample(AdsList));
}

function _open(namespace, url) {
	console.log("clickads.js:$ open")

	console.log(url);
	console.log(">", WTFObject);

	setRandUserAgent();
	setViewPort();
	var AdsService = new Horseman({
		loadImages: _.sample([false])
	});
	console.log(new Date())
	AdsService
		.viewport(currentWidth, currentHeight)
		.userAgent(currentUserAgent)
		.open(url) //"http://prpops.com/p/hhb6/direct/http://popcorn-tstudy.rhcloud.com/"
	.waitForNextPage()
		.then(function() {
			var x = parseInt(fs.readFileSync('var/qtd.var', {
				encoding: 'utf8'
			})) || 0;

			fs.writeFileSync('var/qtd.var', (x + 1).toString());
			console.log('clickads.js: qtdClicados', x);
			console.log("clickads.js: finish")
			AdsService.close();

			console.log("Qtd", x);
			openAds();

			DB.push({
				dt: new Date().getTime(),
				// userAgent: currentUserAgent,
				// ip: WTFObject.YourFuckingIPAddress,
				// loc: WTFObject.YourFuckingLocation,
				// isp: WTFObject.YourFuckingISP,
				// host: WTFObject.YourFuckingHostname
			})
		})
}

(exports.init = function(_mainObj) {
	sharedObj = _mainObj;
	openAds();
})
exports.init({
	clickAdsReady: true
});