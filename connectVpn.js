var exec = require('child_process').exec;
var _ = require('underscore');
var fs = require('fs');

var countryList = JSON.parse(fs.readFileSync('country.json', {
	encoding: 'utf8'
}));
var randCountry = 'not-set';

exports.init = init;

function init(args) {

	execCmd('../hma/hma-vpn.sh -x');
	randCountry = _.sample(countryList);

	console.log('connectVpn.js:'+"$ Rand Country:",randCountry);

	run_cmd('bash',  ['../hma/./hma-vpn.sh','-c', 'password.txt', randCountry],  
		function(text) { 
			console.log (text) 

			if(text.match(/(No matching servers to connect|Please check your internet connection)/)){
				init(args);
			}
			
			if(text.match(/(Connected to)/)) {
				console.log('$$ exec oncomplete')

				fs.writeFileSync('clickAdsReady.var',"1");
				setTimeout(args.onComplete,1000)
			}

		});

};

function execCmd(cmd) {
	var ret = exec(cmd, function(error, stdout, stderr) {
		console.log('$connectVpn.js: stdout',stdout);
		console.log('$connectVpn.js: stderr',stderr);
	});
}

function run_cmd(cmd, args, callBack ) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);

    child.stdout.on('data', 
    	function (buffer) { 
    		callBack('connectVpn.js:'+buffer.toString()) 
    });
    //child.stdout.on('end', function() { callBack (resp) });
} // ()