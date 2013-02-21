//  pull in all the stuff we need
var mongodb = require('mongodb');
var colours = require('colors');
var http = require('http');
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

if (!('MONGOHQ_URL' in process.env)) {
    console.log('>> You need to set you MONGOHQ_URL connection thingy in your enviroment vars.'.error.bold);
    console.log('>> MONGOHQ_URL=[your mongodb connection thingy]'.error);
    console.log('>> See: https://groups.google.com/forum/?fromgroups=#!topic/nodejs/1CnOzd352JE for more information'.error);
    process.exit(0);
};
//  ############################################################################

var connectionUri = url.parse(process.env.MONGOHQ_URL);
var dbName = connectionUri.pathname.replace(/^\//, '');

mongodb.Db.connect(process.env.MONGOHQ_URL, function(err, client) {

  if(err) {

    console.log('Error opening database connection'.error);
    process.exit(0);

  } else {

    console.log('Connected just fine'.info);

    client.collection('widgets', function(err, collection) {

      collection.remove(null, {safe: true}, function(err, result) {

        if (!err) {
          console.log('result of remove ' + result);

          var widgets = []
          var widget1 = {
                          title: 'First Great widget',
                          desc: 'greatest widget of all',
                          print: 14.99
                        };
          widgets.push(widget1);

          var widget2 = {
                          title: 'Second Great widget',
                          desc: 'nearly the greatest widget of all',
                          print: 9.99
                        };
          widgets.push(widget2);

          collection.insert(widgets, {safe: true, keepGoing: true}, function(err, result) {
            if(err) {
              console.log('Error 3'.error);
              console.log(err);
            } else {
              console.log(result);
              client.close();
            }
          });

        } else {
          console.log('Error 2'.error);
          console.log(err);
        }

      });

    });

  }

});

console.log('>> End'.info);

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
