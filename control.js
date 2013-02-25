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
    lastFetched: new Date(),
    fetchLatestArticlesTmr: null,

    mdb: null,
    haikuCollection: null,

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

        this.lastFetched = new Date();

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
                    console.log('>> Didn\'t find results in response'.warn);
                }
            })

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error: " + e.message);
        });

        //  we should probably process the queue in just a moment too
        setTimeout(function() {
            control.processQueue()
        }, 2000);

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

        if (counter > 0) {
            if (counter == 1) {
                console.log('>> 1 new record added'.info);
            } else {
                console.log(('>> ' + counter + ' new records added').info);
            }
        }

    },


    processQueue: function() {

        //  if there's nothing to do we'll get off here
        if (this.processMap.length == 0) {
            return;
        }

        //  Otherwise we need to get an item from the array
        //  and fetch more details from the guardian API.
        //  So remove the id from the map and the object
        //  from the dict.
        var id = this.processMap.shift();
        var miniJSON = this.processDict[id];
        delete this.processDict[id];

        //  NOTE, at this point the current entry is removed from the process
        //  queue, but not yet placed into the processed queue, which means
        //  it's possible that it could be placed back into the queue...
        //  this is unlikely thought as this only gets run once per minute
        //  and it really should have compleated by then.
        //
        //  So, we are going to leave it out until we know we have a good result back
        //  that way if this never gets placed into the processed queue this will
        //  carry on getting added *back* into the process queue over and over again.
        //
        //  To stop the process queue getting too long with "erroring" entries we should
        //  see how long ago they were published and ignore ones over a few hours.

        console.log(('>> fetching id: ' + id).info);

        //  Now we are going to fetch the url
        var url = miniJSON.apiUrl + '?format=json&show-fields=body&order-by=newest&api-key=' + this.guardian.key;

        //  Go and fetch the results
        http.get(url, function(response) {
            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {
                //  TODO: put error checking here
                var json = JSON.parse(output);

                //  check to see if everything is ok
                if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'content' in json.response) {
                    control.preProcessBody(json.response.content, miniJSON.webPublicationDate);
                } else {
                    console.log('>> Didn\'t find content in response'.warn);
                }
            });

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log(('Got error in processQueue: ' + e.message).error);
        });

    },

    //  This is where we add the day/date into the record (to make things easy)
    //  strip the body of markup and work out all the numbers in the stuff
    //  before scanning it and popping it into the processed queue
    preProcessBody: function(json, originalDate) {

        //  pop the original Date into the json object
        //  with a bit of faffing (in a lazy way) to
        //  get the time in a nicer format in there too
        json.originalDate = originalDate;
        json.webPublicationDay = originalDate.split('T')[0];
        json.webPublicationTime = originalDate.split('T')[1].split('Z')[0].split(':');
        json.webPublicationTime.pop();
        json.webPublicationTime = json.webPublicationTime.join(':');

        //  make a clean version of the body, 1st strip all the html tags
        json.body = json.fields.body.replace(/<(?:.|\n)*?>/gm, '');

        //  which has the effect of removing spaces after full stops, so lets put
        //  those back in, but strip double spaces. Oh, all via the medium
        //  of terrible terrible regex, that should really do stuff like only
        //  selecting punctuation that has any character immediately after it,
        //  so if you want to do that knock yourself out, but for this it's
        //  just not that important
        json.body = json.body.replace(/\./g, '. ')
                                .replace(/\?/g, '? ')
                                .replace(/\!/g, '! ')
                                .replace(/  /g, ' ')
                                .replace(/  /g, ' ')
                                .replace(/&quot;/g, '')
                                .replace(/&amp;/g, '&');

        //  And now turn it into an array
        json.body = json.body.split(' ');
        json.bodyNumbers = [];

        for (word in json.body) {
            json.bodyNumbers.push(this.cheapSyllables(json.body[word].replace('.', '').replace('?', '').replace('!', '')));
        }

        delete json.fields;
        
        //  Ok, now I'm here we can push the value onto the processed stack
        //  so it'll not show up again, even if the next step fails.
        this.processedMap.push(json.id);
        this.processedDict[json.id] = json;

        //  Now we need to cull the map if it's too long
        var killThis = null;
        while (this.processedMap.length > 30) {
            killThis = this.processedMap.shift();
            delete this.processedDict[killThis];
        }

        //  This really needs to be thrown into async
        setTimeout(function() {
            control.checkForHaiku(json);
        }, 1000);

    },

    checkForHaiku: function(json) {

        //  Now we are going to do something crazy, we are going to start at the 1st
        //  word of the body text and then make our way through the rest of the words
        //  totting up the syllables until we have a complete Haiku, at any moment
        //  when we go over the syllable limit we shall start all over again, but begining
        //  at the 2nd word of the body text and so on until we've finished
        var currentRow = 0;
        var row = null; //  a quick array of three rows
        var numberFound = 0;

        for (startPosition in json.bodyNumbers) {

            //  reset the current Row and the row data
            currentRow = 0;
            row = [
                    {total: 0, positions: [], words: [], syllables: []},
                    {total: 0, positions: [], words: [], syllables: []},
                    {total: 0, positions: [], words: [], syllables: []}
                ];

            //  Now go through the body from this start position
            //  until the end
            for (var position = startPosition; position < json.bodyNumbers.length; position++) {

                //  push the current position, words, syllables and total
                //  onto the row
                row[currentRow].positions.push(position);
                row[currentRow].words.push(json.body[position]);
                row[currentRow].syllables.push(json.bodyNumbers[position]);
                row[currentRow].total += json.bodyNumbers[position];

                // check the count which depends on the current row we are looking at
                //  if it's exactually the right value then we move onto the next row
                //  if it's under then we keep going, if it's over then we haven't
                //  found a Haiku and we need to move on.
                if (currentRow == 0) {

                    //  Just right
                    if (row[currentRow].total == 5) {
                        currentRow++;
                    }

                    //  over
                    if (row[currentRow].total > 5) {
                        break;
                    }

                } else if (currentRow == 1) {

                    //  Just right
                    if (row[currentRow].total == 7) {
                        currentRow++;
                    }

                    //  over
                    if (row[currentRow].total > 7) {
                        break;
                    }

                } else if (currentRow == 2) {

                    //  Just right
                    if (row[currentRow].total == 5) {
                        if (this.validateHaiku(json.id, row)) {
                            numberFound++;
                        }
                        break;
                    }

                    //  over
                    if (row[currentRow].total > 7) {
                        break;
                    }

                }

            }

        }

        console.log(('>> Number of Haiku found: ' + numberFound).info);

    },


    validateHaiku: function(id, row) {

        //  Just to whittle things down a bit, only count a haiku
        //  if the last work has a period there
        var firstWord = row[0].words[0];
        var lastWord = row[2].words.pop();
        row[2].words.push(lastWord);

        if (firstWord == firstWord.toUpperCase()) {
            if (lastWord.indexOf('.') >= 0 || lastWord.indexOf('?') >= 0 || lastWord.indexOf('!') >= 0) {
                console.log((id).info);
                console.log((row[0].words.join(' ')).haiku);
                console.log((row[1].words.join(' ')).haiku);
                console.log((row[2].words.join(' ')).haiku);
                console.log('----------');

                var rows = [row[0].words.join('+'), row[1].words.join('+'), row[2].words.join('+')];
                var rowId = rows.join('+').replace(/\\/g, '');

                var haikuDict = {
                    id: rowId,
                    row: row,
                    webUrl: this.processedDict[id].webUrl,
                    webTitle: this.processedDict[id].webTitle,
                    webPublicationDay: this.processedDict[id].webPublicationDay,
                    webPublicationTime: this.processedDict[id].webPublicationTime
                }

                //  Pop this into the database, we don't really care what happens unless there's an error
                this.haikuCollection.update({id: rowId}, haikuDict, {upsert: true, safe: true, keepGoing: true}, function(err, result) {
                    if(err) {
                        console.log('>> Error when putting content into the database.'.error);
                        console.log(err);
                    } else {
                        console.log()
                        control.mdb.close();
                    }
                });

                //  return true
                return true;

            }
        }

        return false;

    },

    cheapSyllables: function(word) {

        //  try and work out the syllables, if not then just return
        //  a number high enough to blow it all away.
        try {
            word = word.toLowerCase();
            if(word.length <= 3) { return 1; }
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
            word = word.replace(/^y/, '');
            return word.match(/[aeiouy]{1,2}/g).length;
        } catch(er) {
            return 100;
        }
    }
}
