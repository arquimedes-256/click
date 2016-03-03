var exec = require('child_process').exec;
var _ = require('underscore');
var fs = require('fs');

var countryList = JSON.parse(fs.readFileSync('country.json', {
	encoding: 'utf8'
}));
var randCountry = 'not-set';
var vpnList = [];
var WTFObject = {}

function init(args) {
	console.log("Inicializando VPN", exports.proc)
	fs.writeFileSync('var/clickAdsReady.var', 0);
	if (exports.proc)
		exports.proc.kill('SIGINT')

	(function stepA() {
		console.log('baixando meta dados...')
		exec("wget https://wtfismyip.com/json -O var/WTFObject.json", function() {
			WTFObject = JSON.parse(fs.readFileSync('var/WTFObject.json'));
			console.log(WTFObject);
			stepB();
		})
	})();

	function stepB() {
		exec('cd /etc/openvpn/ && ls *.ovpn', function(error, stdout, stderr) {
			vpnList = _.difference(stdout.split('\n'), ['']);
			console.log(vpnList);
			stepC();
		});
	}

	function stepC() {

		var randVpn = _.sample(vpnList)
		console.log('$ using vpn:', randVpn);
		var VPNContent = fs.readFileSync('/etc/openvpn/' + randVpn, {
				encoding: 'utf8'
			})
			.replace(/^auth-user-pass$/gim, "auth-user-pass /etc/openvpn/auth.txt");

		fs.writeFileSync('/etc/openvpn/currentVPN.ovpn', VPNContent);

		exports.proc = run_cmd('openvpn', ['/etc/openvpn/currentVPN.ovpn'],
			function(text) {
				console.log(text)

				if (text.match(/(No matching servers to connect|Please check your internet connection)/)) {
					exports.init(args);
				}

				if (text.match(/(Initialization Sequence Completed)/)) {
					console.log('$$ exec oncomplete')

					fs.writeFileSync('var/clickAdsReady.var', "1");
					setTimeout(args.onComplete, 1000)
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
exports.init = function() {
	clearTimeout(initTimeout);
	initTimeout = setTimeout(init);
};