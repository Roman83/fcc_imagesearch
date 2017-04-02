var express = require('express');
var http = require('https');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var app = express();
var port = process.env.PORT || 8080;
var key = process.env.KEY;
var cx = process.env.CX;

var history = function() {
    var history = [];
    var mongoUrl = 'mongodb://localhost:27017/test';

    MongoClient.connect(mongoUrl, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server.");
        db.close();
    });

    res = {
        'update': function (str) {

            MongoClient.connect(mongoUrl, function(err, db) {
                assert.equal(null, err);
                db.collection('history').insertOne(
                    {'q': str, 'date': new Date()},
                    function(err, result) {
                        assert.equal(err, null);
                        db.close();
                    }
                );
            });
        },
        'get': function(callback) {
            MongoClient.connect(mongoUrl, function(err, db) {
                assert.equal(null, err);
                db.collection('history').find().toArray(
                    function(err, docs) {
                        callback(JSON.stringify(docs.map(function (v) {
                            return {'q':v.q, 'date':v.date};
                        })));
                    }
                );
                db.close();
            });
        }
    };
    return res;
}();

app.get('/search/:data', function (req, res) {

    var offset = req.query.offset || 1;
    var q = req.params.data;
    var url = 'https://www.googleapis.com/customsearch/v1?key=' + key +
            '&q=' + q +
            '&cx=' + cx + '&searchType=image' + 
            '&start=' + offset;

    history.update(q);

    http.get(url, function(httpres) {
        var body = '';
        httpres.on('data', function(chunk){
            body += chunk;
        });

        httpres.on('end', function(){
            body = JSON.parse(body);
            if (!body.items) {
                res.send('error');
                return;
            }
            res.send(body.items.map(function(i) {
                return {'url': i.link,
                        'alttext': i.title,
                        'pageurl': i.image.contextLink
                       };
            }));
        });

        httpres.on('error', function() {
            res.send('error');
        });
    }).on('error', function() {
        res.send('error');
    });
});

app.get('/latest', function (req, res) {
    history.get(function(s) {
        console.log(s);
        res.send(s);
    });
});

app.listen(port);
