var express = require('express');
var http = require('https');
var app = express();
var port = process.env.PORT || 8080;
var key = process.env.KEY;
var cx = process.env.CX;

var history = function() {
    var history = [];
    res = {
        'update': function (str) {
            if (history.unshift({'q': str, 'date': new Date()}) > 10) {
                history.pop();
            }
        },
        'get': function() {
            return JSON.stringify(history);
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
    res.send(history.get());
});

app.listen(port);












