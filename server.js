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

require('./control.js');

//  check to see if we have been passed a guardian api key as a url parameter
//  if we did then we need to write it to a file.

//if ('guardian' in argv && 'api' in argv.guardian) {
//    fs.writeFileSync('./guardian.key', argv.guardian.api, 'utf-8');
//    console.log(('>> new guardian.key file written with: ' + argv.guardian.api).help);
//}

//  Check to see if the guardian.key file exists, if so we can read it
//  in, otherwise we need to exit.
if (fs.existsSync('./guardian.key')) {
    
    //  read in the file and start up the control thingy
    control.init(fs.readFileSync('./guardian.key', 'utf-8'));

} else {

    //  start it up and send over null
    console.log('>> Please visit the server in a web browser to enter your guardian API key.'.help);
    control.init(null);

};


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
    //  check to see if we have been passed a guardian api key as a url parameter
    //  if we did then we need to write it to a file, if the file doesn't already
    //  exist
    //
    //  ########################################################################
    if ('apikey' in url.parse(request.url, true).query && !fs.existsSync('./guardian.key')) {

      //  grab the api key
      //  TODO, validation here
      var apikey = url.parse(request.url, true).query.apikey;
      console.log(('>> new guardian.key file written with: ' + apikey).info);

      //  Write the file to the file system 
      fs.writeFileSync('./guardian.key', apikey, 'utf-8');

      //  call the init on control again.
      control.init(apikey);

      //  redirect to the root url to drop the url parameter
      response.writeHead(302, { 'Location': '/' });
      response.end();
    }


    //  ########################################################################
    //
    //  THIS IS THE ONE WE REALLY CARE ABOUT, as it will...
    //  Let the user know the current status of the server.
    //
    //  ########################################################################
    request.on('end', function () {

        console.log(('key: ' + control.guardian.key).warn);

        //  If we don't have a guardian api key then we need to
        //  ask the user for one. Using a VERY BAD FORM!!!
        //  WHICH WE WILL FIX :)
        if (control.guardian.key == null) {
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.write('You need to enter a Guardian API key<br />');
          response.write('<form><input name="apikey" type="text" /></form><br />');
          response.end();
        } else {
          control.count++;
          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.end('Hello world : ' + control.count.toString());
        }
    });

}).listen(1337);


console.log('Server running at http://127.0.0.1:1337/'.info);
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
