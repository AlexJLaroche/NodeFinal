const express = require('express');
const session = require('express-session');
const  bodyParser = require('body-parser');
const hbs = require('hbs');
const utils = require('./utils.js');




const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_SECRET = 'ssh!quiet,it\'asecrat!',
} = process.env;

const IN_PROD = NODE_ENV === 'production';



const app = express();
hbs.registerPartials(__dirname + '/views/partials') ;


app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({type: 'text/html'}));

app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
        sameSite: true,
        secure: IN_PROD,
        maxAge: 200000000
    }
}));

const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login')
    }else{
        next()
    }
};

const redirectHome = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/home')
    }else{
        next()
    }
};

app.get('/', (req, res) => {
    const { userId } = req.session;

    res.render(`${userId ? `tictactoe.hbs` : `SignIN.hbs`}`)

});


app.get('/home', redirectLogin, (req, res) => {
    // const { user } = res.locals;
    res.render('tictactoe.hbs')
});

app.get('/login', redirectHome, (req, res) => {
    res.render('SignIN.hbs')

});

app.get('/register', redirectHome, (req, res) => {
    res.render('SignIN.hbs')

});

app.post('/login', redirectHome, (req, res) => {
    var db = utils.getDb();
    db.collection('users').find({username: `${req.body.username}`}).toArray().then(function (feedbacks) {
        if (feedbacks.length === 0) {
            res.redirect('/login')
        } else {
            if(req.body.password === feedbacks[0].password) {
                req.session.userId = feedbacks[0].username;
                console.log(`${req.session.userId} logged in`);
                return res.redirect('/home')

            }else{
                res.redirect('/login')
            }
        }
    });
});


app.post('/register', redirectHome, (req, res) => {
    var db = utils.getDb();
    db.collection('users').find({username: `${req.body.username}`}).toArray().then(function (feedbacks) {
        if (feedbacks.length === 0) {
            delete req.body._id; // for safety reasons
            req.body["game"] = {};
            db.collection('users').insertOne(req.body);
            req.session.userId = req.body.username;
            return res.redirect('/home')
        } else {
            res.redirect('/login')
        }
    })
});

app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home')
        }
        res.clearCookie(SESS_NAME);
        res.redirect('/login')
    })
});

app.post('/savegame', redirectLogin, (req, res) => {
    var db = utils.getDb();
    console.log(req);
    db.collection('users').find({username: `${req.session.userId}`}).toArray().then(function (feedbacks) {
        feedbacks[0]["game"] = req.body;
        return res.redirect('/home')
    })
});




app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    utils.init();
});

