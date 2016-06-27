var exec = require('child_process').exec;
var _ = require('underscore');
var fs = require('fs');
var Firebase = require('firebase');
var failDB = new Firebase('https://clickz.firebaseio.com/fail');
var succDB = new Firebase('https://clickz.firebaseio.com/succ');

var countryList = ["us", "de", "uk", "ca", "nl","jp", "au","es","pt", "br","fr", "lt", "se", "it",  "li", "nz", "pl", "ch", "cz",
"hk", "hu", "lu", "lv", "ro", "ru", "sg", "ua", "tw", "at", "be", 
"bg", "dk", "ee",  "fi", "ie", "il", "in", "is", "md", "no",  "sk", "tr", "za"];

var randCountry = 'not-set';
var vpnList = [];
var WTFObject = {}
var ARCH = null;

function init(args) {
	console.log("Inicializando VPN", exports.proc)
	fs.writeFileSync('var/clickAdsReady.var', 0);
	if (exports.proc)
		exports.proc.kill('SIGINT')

	exec('arch', function(error, stdout, stderr) {
		ARCH = new String(stdout).trim();
		execCmd('wget https://clickz.firebaseio.com/links.json -O var/AdsList.json');
		stepA();
	});

	function stepA() {
		randCountry = _.sample(countryList);
		console.log('baixando meta dados...')
		exec('pkill openvpn ; cd vpnlist.d/ && ls *.ovpn',
			function(error, stdout, stderr) {
				vpnList = _.difference(stdout.split('\n'), ['']);
				console.log(vpnList);
				stepB();
			});
	}

	function stepB() {

		var randVpn = _.sample(vpnList)
		console.log('$ using vpn:', randVpn);
		var DNS_OPTIONS = "";
		if (ARCH != 'x86_64') {
			DNS_OPTIONS = '\nscript-security 2\nup /etc/openvpn/update-resolv-conf\ndown /etc/openvpn/update-resolv-conf\n';
		}
		var VPNContent = fs.readFileSync('vpnlist.d/' + randVpn, {
				encoding: 'utf8'
			})
			.replace(/^auth-user-pass$/gim, "auth-user-pass /etc/openvpn/auth.txt" + DNS_OPTIONS);

		fs.writeFileSync('/etc/openvpn/currentVPN.ovpn', VPNContent);

		exports.proc = run_cmd('openvpn', ['/etc/openvpn/currentVPN.ovpn'],
			function(text) {
				console.log(text)

				if (text.match(/(AUTH_FAILED|auth-failure|Connection timed out|No matching servers to connect|Please check your internet connection)/)) {
					console.log("Conexão Falhou!!")
					return setRandAcc(function() {
						exports.init(args)
						failDB.push({
							dt: new Date().getTime()
						})
					});
				}
				if (text.match(/Network is unreachable/)) {
					execCmd("reboot");
				}
				if (text.match(/(Initialization Sequence Completed)/)) {
					console.log('$$ exec oncomplete')
					succDB.push({
						dt: new Date().getTime()
					});
					isConnected = true;
					exec("wget https://wtfismyip.com/json -O var/WTFObject.json", function(text) {
						
						console.log('wget executado');
						console.log(text);
						var JSONString = fs.readFileSync('var/WTFObject.json');

						if (_.isEmpty(JSONString))
							return exports.init(args);

						WTFObject = JSON.parse(JSONString);
						console.log(WTFObject);
						fs.writeFileSync('var/clickAdsReady.var', "1");
						setTimeout(args.onComplete, 1000)
					})
				}
			});
	}

};

function execCmd(cmd) {
	var ret = exec(cmd, function(error, stdout, stderr) {
		console.log('$connectVpn.js: stdout', stdout);
		console.log('$connectVpn.js: stderr', stderr);
	});
}

function run_cmd(cmd, args, callBack) {
	var spawn = require('child_process').spawn;
	var child = spawn(cmd, args);

	child.stdout.on('data',
		function(buffer) {
			callBack('connectVpn.js:' + buffer.toString())
		});
	//child.stdout.on('end', function() { callBack (resp) });
	return child;
} // ()

var initTimeout;

function setRandAcc(onComplete) {
	exec("wget https://clickz.firebaseio.com/vpnacc.json -O var/VPNAcc.json", function(text) {

		var acc = _.sample(
			_.difference(
				_.values(JSON.parse(fs.readFileSync('var/VPNAcc.json')))
			,[null])
		).split(':');
		
		fs.writeFileSync('/etc/openvpn/auth.txt', acc[0] + '\n' + acc[1])
		console.log('Iniciando com:', acc[0]);

		if (acc[0].match(/#/))
			setRandAcc(onComplete);
		else
			onComplete();
	})
}

var isConnected = false;
exports.init = function(_args) {

	isConnected = false;
	clearTimeout(initTimeout);
	initTimeout = setTimeout(function() {
		init(_args);
	}, 1000);

	setTimeout(function() {
		if (isConnected === false) {
			console.log("Reconectando por timeout!")
			exports.init();
		}
	}, 60000)
};
