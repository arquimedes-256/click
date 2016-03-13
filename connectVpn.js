var exec = require('child_process').exec;
var _ = require('underscore');
var fs = require('fs');

var countryList = ["us","de","uk","ca","nl","au","lt","se","it","jp","li","nz","pl","ch","cz","fr","hk","hu","lu","lv","ro","ru","sg","ua","tw","at","be","bg","br","dk","ee","es","fi","ie","il","in","is","md","no","pt","sk","tr","za"];
var randCountry = 'not-set';
var vpnList = [];
var WTFObject = {}
var ARCH = null;

function init(args) {
	console.log("Inicializando VPN", exports.proc)
	fs.writeFileSync('var/clickAdsReady.var', 0);
	if (exports.proc)
		exports.proc.kill('SIGINT')

	exec('arch',function(error, stdout, stderr) {
		ARCH = new String(stdout).trim();
		stepA();
	});

	function stepA() {
		randCountry = _.sample(countryList);
		console.log('baixando meta dados...')
		exec('pkill openvpn ; cd /etc/openvpn/ && ls '+randCountry+'*.ovpn', 
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
		if(ARCH != 'x86_64'){
			DNS_OPTIONS = '\nscript-security 2\nup /etc/openvpn/update-resolv-conf\ndown /etc/openvpn/update-resolv-conf\n';
		}
		var VPNContent = fs.readFileSync('/etc/openvpn/' + randVpn, {
				encoding: 'utf8'
			})
			.replace(/^auth-user-pass$/gim, "auth-user-pass /etc/openvpn/auth.txt"+DNS_OPTIONS);

		fs.writeFileSync('/etc/openvpn/currentVPN.ovpn', VPNContent);

		exports.proc = run_cmd('openvpn', ['/etc/openvpn/currentVPN.ovpn'],
			function(text) {
				console.log(text)

				if (text.match(/(Connection timed out|No matching servers to connect|Please check your internet connection)/)) {
					exports.init(args);
				}

				if (text.match(/(Initialization Sequence Completed)/)) {
					console.log('$$ exec oncomplete')

					exec("wget https://wtfismyip.com/json -O var/WTFObject.json", function(text) {
						console.log('wget executado');
						WTFObject = JSON.parse(fs.readFileSync('var/WTFObject.json'));
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
exports.init = function(_args) {
	
	clearTimeout(initTimeout);
	initTimeout = setTimeout(function(){ init(_args);  });
};
