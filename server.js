//  pull in all the stuff we need
var http = require('http');
var fs = require('fs');
var colours = require('colors');
var argv = require('optimist').argv;

console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

colours.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

require('./control.js');

//  check to see if we have been passed a guardian api key as a parameter to the
//  server on starting up, if we do then we need to write it to a file.
if ('guardian' in argv && 'api' in argv.guardian) {
    fs.writeFileSync('./guardian.key', argv.guardian.api, 'utf-8');
    console.log(('>> new guardian.key file written with: ' + argv.guardian.api).help);
}

//  Check to see if the guardian.key file exists, if so we can read it
//  in, otherwise we need to exit.
if (fs.existsSync('./guardian.key')) {
    
    //  read in the file and start up the control thingy
    control.init(fs.readFileSync('./guardian.key'), 'utf-8');

} else {
    console.log('>> Don\'t have file'.error);
    console.log('>> Try starting server with: node server.js --guardian.api=your-api-key'.help);
    console.log('>> You only need to do that once.'.help);
    process.exit(0);
};


//  ############################################################################
//  
//  Server stuff
//
//  ############################################################################

http.createServer(function (request, response) {

    //  tell the favicon to sod off
    if (request.url === '/favicon.ico') {
        response.writeHead(200, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }

    //  Let the user know the current status of the server.
    request.on('end', function () {
        control.count++;
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(control.guardian.key + ' : ' + control.count.toString());
    });

}).listen(1337);


console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
console.log('Server running at http://127.0.0.1:1337/');
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
