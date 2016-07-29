
var http = require("http");
var fs = require('fs');
const arc = require('./arc.js');

var config = {
		'static': 'static',
		'port': 8081,
		'cache-modules': false,
		'rewrites': {
			'/favicon.ico': '/static/favicon.ico'
		}
	};

var server = http.createServer(
	function (request, response) {
		//==========================
		//if (!config['cache-modules'])
		//	delete require.cache[__dirname+'/arc.js'];
		//arc = require(__dirname+'/arc.js');
		//==========================
		var url = request.url;
		if (typeof config.rewrites[url] == 'string')
			url = config.rewrites[url];
		var params = {};
		//
		if (url.indexOf('?') == -1){
			//	Simple RPC
			url = url.substring(1).split('/');
		}
		else{
			//	We have '&' delimited query string
			var querystring = url.substring(url.indexOf('?')+1).split('&');
			url = url.substring(1, url.indexOf('?')).split('/');
			//
			for (var i = 0; i < querystring.length; i++){
				querystring[i] = querystring[i].split('=');
				params[querystring[i][0]] = querystring[i][1];
			}
		}
		//	Process parameters in query string segments ('/' delimited)
		for (var i = 2; i < url.length; i++)
			params[i-2] = url[i];
		//
		if (url[0] == config['static']){
			//	Serve static files
			fs.readFile(__dirname+'/'+url.join('/'), 'utf8',
				function(err, data) {
					if (err){
						console.log(err);
						response.writeHead(404, {'Content-Type': 'text/html'});
						response.end('<h1>404: Static File Not Found</h1>');
					}
					else
						response.writeHead(200, {});	//	Get the MIME of file
						response.end(data);
						//	Minify JS and CSS can be done here
				});
		}
		else{
			//	Default module and function - if not defined (root / home)
			if (url.length == 0 || url[0] == '')
				url = ['index', 'index'];
			else if (url.length == 1)
				url[1] = 'index';
			//
			//	Check if module exists
			fs.exists(__dirname+'/modules/'+url[0]+'.js',
				function(exists){
					console.log('--------------------------------');
					console.log('Request: '+request.url);
					if (exists){
						//	Remove from cache and reload module
						if (!config['cache-modules'])
							delete require.cache[__dirname+'/modules/'+url[0]+'.js'];
						var module = require(__dirname+'/modules/'+url[0]+'.js');
						//
						//	Check if function exists in module
						if (typeof module[url[1]] == 'function'){
							try{
								var res = module[url[1]](request, response, params);
								if (res != null & res != false){
									//	Check return type
									if (typeof res == 'object'){
										//	We have an object / data structure
										if (typeof res.error != 'undefined'){
											response.writeHead(500, {'Content-Type': 'text/json'});
											console.log('\033[91m'+res.error+'\033[0m');
										}
										else{
											response.writeHead(200, {'Content-Type': 'text/json'});
											console.log('\033[92mServed: 200\033[0m');
										}
										//	Write as JSON
										response.end(JSON.stringify(res));
									}
									else{
										//	We have a string - hopefully
										response.writeHead(200, {'Content-Type': 'text/html'});
										response.end(res);
										console.log('\033[92mServed: 200\033[0m');
									}
								}
								//else
								//	console.log('\033[92mServed: 200\033[0m');
							}
							catch(e){
								//	Error in module
								response.writeHead(500, {'Content-Type': 'text/html'});
								e.stack = e.stack.split('\n');
								e.stack.splice(e.stack.length-2, 2);
								var error = e.stack[0], trace = '';
								e.stack.splice(0, 1);
								for (var line in e.stack){
									console.log('\033[93m'+e.stack[line].replace(' at', '>')+'\033[0m');
									trace += e.stack[line].replace(__dirname, '').replace('  at', '> ')+'<br/>';
								}
								response.end('<h1>500: Internal Server Error</h1>'+
											'<b>'+error+'</b><br/>'+
											'In '+'/modules/'+url[0]+'.js'+//__dirname+
											'<pre>'+trace+'</pre>');
								console.log('\033[91m'+error+'\033[0m');
								//colors = {'error': '\033[91m', 'success': '\033[92m', 'warning': '\033[93m', 'info': ''}#\033[94m
								//console.log('\033[92m'+succes+'\033[0m');
								//console.log('\033[93m'+warning+'\033[0m');
							}
						}
						else{
							response.writeHead(404, {'Content-Type': 'text/html'});
							response.end('<h1>404: Module/Method <i>'+url[0]+'/'+url[1]+'</i> Not Found</h1>');
							console.log('\033[93m404: Module/Method '+url[0]+'/'+url[1]+' Not Found\033[0m');
						}
					}
					else{
						response.writeHead(404, {'Content-Type': 'text/html'});
						response.end('<h1>404: Module <i>'+url[0]+'</i> Not Found</h1>');
						console.log('\033[93m404: Module '+url[0]+' Not Found\033[0m');
					}
				});
		}
	}
);

server.on('error',
	function(e){
		console.log('--------------------------------');
		console.log('\033[91m'+e.errno+'\033[0m');
		console.log({'EADDRINUSE': 'Port '+config['port']+' is already in use.', 'EACCES': 'Port '+config['port']+' is not allowed to bind.'}[e.errno]);
	});

server.listen(config['port']);

//	----------------------------------------------------------------------------------------------------------------------------

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

if ('ab'.substr(-1) != 'b'){
	String.prototype.substr = function(substr){
		return function(start, length){
			return substr.call(this, start < 0 ? this.length + start : start, length)
		}
	}(String.prototype.substr);
}

if (!String.prototype.trim){
	String.prototype.trim = function (){
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
		//return this.replace(/s+/g, '');
	};
}

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    // Could we try:
    // return Array(count + 1).join(this);
    return rpt;
  }
}
