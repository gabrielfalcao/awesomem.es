require('./extensions');

var _ = require('underscore')._,
express = require('express'),
fs = require('fs'),
util = require('util'),
path = require('path'),
crypto = require('crypto'),
everyauth = require('everyauth'),
Canvas = require('canvas'),
RedisStore = require('connect-redis')(express);

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
    var redis = require("redis").createClient();
}

var app = express.createServer();
var io = require('socket.io').listen(app);

var jade = require('jade');

everyauth.facebook
    .appId('195376883881120')
    .appSecret('71e3c97c56da2e71f83775aa131a1be8')
    .scope('user_about_me,user_photos,friends_photos,email,publish_stream')
    .findOrCreateUser(function(session, access_token, accessTokExtra, user) {
        redis.zscore("awes:authenticated-users", user.id, function(err, num){
            var score = (num || 0) + 1;
            redis.zadd("awes:authenticated-users", score, user.id, function(err){
                redis.hmset("awes:user:" + user.id, user, function(err) {
                    io.sockets.on('connection', function (socket) {
                        //socket.emit('');
                    });
                });
            });
        });
        session.user = user;
        session.access_token = access_token;
        return user;
    })
    .logoutPath('/logout')
    .handleLogout(function(request, response){
        request.session.user = null;
        request.logout();
        response.redirect('/');
    })
    .redirectPath('/');

everyauth.helpExpress(app);

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(express.static(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'afb40914b6084e7ca58890a9701982c3cbdd95be',
        store: new RedisStore({ client: redis })
    }));
    app.use(everyauth.middleware());

    app.use(function(request, response, next){
        response.show = function (name, context) {
            var c = _.extend(context || {}, {
                title: 'Remarkable meme chats | Awesome Memes',
                request: request,
                user: request.session.user,
                background_images: require('./background_images').list
            });
            response.render(name, c);
        }
        return next();
    });
    app.use(app.router);

});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.get('/', function(request, response){
    return response.show('index');
});

app.get('/generate', function(req, res){
    res.show('generate');
});
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

app.get('/img/:bg/:top_text;:bottom_text.png', function(request, response) {
    var given_filename = __dirname + '/background_images/' + request.param('bg', 'baby') + '.png';
    var fallback_background_filename = __dirname + '/background_images/baby.png';
    var top_text = request.param('top_text');
    var bottom_text = request.param('bottom_text');

    path.exists(given_filename, function(path_exists){
        var background_path = path_exists ? given_filename : fallback_background_filename;
        return render_meme(background_path, top_text, bottom_text, request, response);
    });
});

io.sockets.on('connection', function (socket) {
    socket.emit('connected');
});
function render_meme(background_name, top_text, bottom_text, request, response) {
    var data = {
        top_text: top_text,
        bottom_text: bottom_text,
    };
    if (!data.top_text && !data.bottom_text) {
        return;
    }
    var top_text = data.top_text || "";
    var bottom_text = data.bottom_text || "";

    fs.readFile(background_name, function (err, raw){
        var image = new Canvas.Image();
        image.src = raw;

        var canvas = new Canvas(400, 400);
        var ctx = canvas.getContext('2d');

        ctx.antialias = 'subpixel';
        ctx.font = '36px Impact';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#FFFFFF'

        ctx.drawImage(image, 0, 0, 400, 400);

        var top_chunks = top_text.chunkify(25);
        var bottom_chunks = bottom_text.chunkify(25);
        var base_bottom = 400 - (bottom_chunks.length * (40) + 10);

        top_chunks.forEach(function(str, index){
            ctx.strokeText(str, 10, 40 * (index + 1));
            ctx.fillText(str, 10, 40 * (index + 1));
        });

        bottom_chunks.forEach(function(str, index){
            ctx.strokeText(str, 10, base_bottom + (40 * (index + 1)));
            ctx.fillText(str, 10, base_bottom + (40 * (index + 1)));
        });

        response.send(canvas.toBuffer(), {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000'
        });

    });
}
app.listen(process.env.PORT || 8000);