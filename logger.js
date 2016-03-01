
var lastLog = '';

exports.log = function(L){
	if(L != lastLog){
		console.log(L)
		lastLog = L;
	}
}