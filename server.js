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
  error: 'red',
  haiku: 'magenta'
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

//  We're not actually doing any of this at the moment
var connectionUri = url.parse(process.env.MONGOHQ_URL);
var dbName = connectionUri.pathname.replace(/^\//, '');
 
mongodb.Db.connect(process.env.MONGOHQ_URL, function(err, mdb) {
 
  if(err) {
 
    console.log('Error opening database connection'.error);
    process.exit(0);
 
  } else {
 
    require('./control.js');
    control.init(process.env.GUARDIANAPI);
    console.log('Connected just fine'.info);
 
    control.mdb = mdb;
 
    mdb.collection('haiku', function(err, collection) {
      if (!err) {
        control.haikuCollection = collection;
      } else {
        console.log('Error connecting to collection'.error);
        process.exit(0);
      }
    });
 
  }
 
});


//  Now that we have safely got here we can carry on as though nothing is wrong

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

    //  Force a fetch of the articles
    if (request.url === '/queueArticles') {

        //  For the moment go and fetch the latest articles here
        //  this will normally be on an interval
        control.fetchLatestArticles();

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('New articles have been queued<br />');
        response.write('<p>');
        response.write('<a href="/">Go Back</a>');
        response.write('</p>');
        response.end();
        return;
    }


    //  Force a fetch of the articles
    if (request.url === '/processQueue') {

        //  For the moment go and fetch the latest articles here
        //  this will normally be on an interval
        control.processQueue();

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('Processing queue<br />');
        response.write('<p>');
        response.write('<a href="/">Go Back</a>');
        response.write('</p>');
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

        response.writeHead(200, {'Content-Type': 'text/html'});
        //response.write(control.removeWidgets() + '<br />') <--- this doesn't really work.

        var lastFetched = Math.floor((new Date() - control.lastFetched)/1000);
        response.write('Server started: ' + control.serverStarted.toString() + '<br />');
        response.write('Last fetched: ' + lastFetched.toString() + ' seconds ago<br />');
        response.write('<hr>');

        response.write('<ol>');
        for (i in control.processMap) {
          response.write('<li>' + control.processDict[control.processMap[i]].webPublicationDate + ' - ' + control.processMap[i] + '</li>');
        }
        response.write('</ol>')
        response.write('Remaining in todo list: ' + control.processMap.length.toString() + '<br />');
        response.write('<hr>');

        response.write('<ol>');
        for (i in control.processedMap) {
          response.write('<li>' + control.processedDict[control.processedMap[i]].webPublicationDate + ' - ' + control.processedMap[i] + '</li>');
        }
        response.write('</ol>')
        response.write('Total in prcessed list: ' + control.processedMap.length.toString() + '<br />');
        response.write('<hr>');

        response.write('Counter : ' + control.count.toString() + '<br />');
        response.write('<p>');
        response.write('<a href="/processQueue">Process queue</a> | <a href="/queueArticles">Queue articles</a><br />');
        response.write('</p>');
        response.end();

    });

}).listen(1337);


console.log('Server running at http://127.0.0.1:1337/'.info);
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
