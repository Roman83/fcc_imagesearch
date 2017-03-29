var express = require('express');
var http = require('https');
var app = express();
var port = process.env.PORT || 8080;
var key = process.env.KEY;
var cx = process.env.CX;
var history = [];

console.log(key);
console.log(cx);

app.get('/search/:data', function (req, res) {

    var offset = req.query.offset || 1;
    var url = 'https://www.googleapis.com/customsearch/v1?key=' + key +
            '&q=' + req.params.data +
            '&cx=' + cx + '&searchType=image' + 
            '&start=' + offset;

    http.get(url, function(httpres) {
        var body = '';
        httpres.on('data', function(chunk){
            body += chunk;
        });

        httpres.on('end', function(){
            body = JSON.parse(body);
            res.send(body.items.map(function(i) {
                return {'url': i.link,
                        'alttext': i.title,
                        'pageurl': i.image.contextLink
                       };
            }));
        });
    });

});

app.get('/latest', function (req, res) {
    res.send(history);
});

app.listen(port);
