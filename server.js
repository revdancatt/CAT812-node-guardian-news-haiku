//  pull in all the stuff we need
var http = require('http');
var fs = require('fs');
var colours = require('colors');
var url  = require('url');

console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

colours.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

//  ############################################################################
//  Check to see if the guardian API key exists in the enviroment vars
//  If not then we need to tell the user they need to set the var
if (!('GUARDIANAPI' in process.env)) {
    console.log('>> You need to set you Guardian API key in your enviroment vars.'.error.bold);
    console.log('>> GUARDIANAPI=[your guardian api key]'.error);
    console.log('>> See: https://groups.google.com/forum/?fromgroups=#!topic/nodejs/1CnOzd352JE for more information'.error);
    process.exit(0);
};

if (!('MONGODB' in process.env)) {
    console.log('>> You need to set you MONGODB connection thingy in your enviroment vars.'.error.bold);
    console.log('>> MONGODB=[your mongodb connection thingy]'.error);
    console.log('>> See: https://groups.google.com/forum/?fromgroups=#!topic/nodejs/1CnOzd352JE for more information'.error);
    process.exit(0);
};
//  ############################################################################


//  Now that we have safely got here we can carry on as though nothing is wrong
require('./control.js');
control.init(process.env.GUARDIANAPI);

//  ############################################################################
//  
//  Server stuff
//
//  ############################################################################

http.createServer(function (request, response) {


    //  ########################################################################
    //
    //  tell the favicon to sod off
    //
    //  ########################################################################
    if (request.url === '/favicon.ico') {
        response.writeHead(200, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }

    //  ########################################################################
    //
    //  THIS IS THE ONE WE REALLY CARE ABOUT, as it will...
    //  Let the user know the current status of the server.
    //
    //  ########################################################################
    request.on('end', function () {

        control.count++;
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Hello brave new world : ' + control.count.toString());

    });

}).listen(1337);


console.log('Server running at http://127.0.0.1:1337/'.info);
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
