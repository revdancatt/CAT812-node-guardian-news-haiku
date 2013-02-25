var http = require('http');

control = {

    count: 1,
    guardian: {
            key: null
        },
    //mdb: null,
    //widgetsCollection: null,
    timeNow: null,
    processMap: [],
    processDict: {},
    processedMap: [],
    processedDict: {},
    serverStarted: new Date(),
    fetchLatestArticlesTmr: null,

    init: function(key) {

        //  set up all the things
        this.guardian.key = key;
        this.count = 6;

        //  Set the fetchLatestArticles onto a intereval
        this.fetchLatestArticlesTmr = setInterval(function() {
            control.fetchLatestArticles();
        }, 1000 * 60);

        //  Add call is anyway to kick things off
        this.fetchLatestArticles();

    },


    fetchLatestArticles: function() {

        console.log('In fetchLatestArticles()'.info);
        console.log('========================'.info.bold);

        //  Go find *NOT* liveblogs in the uk or world sections (which are the two main "news" sections)
        var url = 'http://content.guardianapis.com/search?page-size=20&tag=type/article,-tone%2Fminutebyminute&section=uk%7Cworld&format=json&api-key=' + this.guardian.key;

        //  Go and fetch the results
        http.get(url, function(response) {

            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {

                //  TODO: put error checking here
                var json = JSON.parse(output);

                //  TODO: handle any of the below failing so we can just carry on
                if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'results' in json.response && json.response.results.length > 0) {
                    control.fillMapsAndDicts(json.response.results);
                } else {
                    console.log('Didn\'t find results in response'.warn);
                }
            })

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error: " + e.message);
        });

    },

    //  Now we have the results we need to loop through and find out which ones
    //  we already have and which ones we don't
    fillMapsAndDicts: function(results) {


        var counter = 0;
        for (i in results) {

            //  If the id *isn't* in 'to be processed' or 'has already been processed' list
            //  then we can add it
            if (!(results[i].id in this.processDict || results[i].id in this.processedDict)) {
                this.processDict[results[i].id] = results[i];
                this.processMap.push(results[i].id);
                console.log(('>> Added: ' + results[i].id).info);
                counter++;
            }
        }

        if (counter == 1) {
            console.log('>> 1 new record added'.info);
        } else {
            console.log(('>> ' + counter + ' new records added').info);
        }
        console.log('========================'.info.bold);

    },


    //  Old code that I'm keeping around for the moment
    removeWidgets: function() {

        control.widgetsCollection.remove(null, {safe: true}, function(err, result) {
            if (err) {
                console.log('>> Failed to remove Widgets'.warning);
            } else {
                //  QUESTION: This gets called twice, work out why.
                console.log(('>> ' + result + ' records removed').info);
            }
        });

    },

    //  Old code that I'm keeping around for the moment
    saveWidgets: function() {

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

        this.widgetsCollection.insert(widgets, {safe: true, keepGoing: true}, function(err, result) {
            if(err) {
                console.log('Error 3'.error);
                console.log(err);
            } else {
                console.log(result);
                control.mdb.close();
            }
        });

    }

}
