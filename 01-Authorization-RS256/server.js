const express = require('express');
const app = express();
const {auth, requiredScopes} = require('express-oauth2-jwt-bearer');
const cors = require('cors');
const request = require("request");
const bodyParser = require('body-parser')

require('dotenv').config();

if (!process.env.ISSUER_BASE_URL || !process.env.AUDIENCE) {
    throw 'Make sure you have ISSUER_BASE_URL, and AUDIENCE in your .env file';
}

const corsOptions = {
    origin: 'http://localhost:3000'
};

app.use(cors(corsOptions));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const checkJwt = auth();

app.get('/api/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

app.get('/api/private', checkJwt, function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
});

app.get('/api/private-scoped', checkJwt, requiredScopes('create:invoices'), function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated and have a scope of create:invoices to see this.'
    });
});

app.post('/api/login', function (req, res) {

    //console.log(req.body);

    var options = {
        method: 'POST',
        url: process.env.AUTH_URL,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        form:
            {
                grant_type: 'password',
                username: req.body.username,
                password: req.body.password,
                audience: 'https://sf-replatform.dev.com',
                scope: 'create:invoices openid profile email',
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
            }
    };

    request(options, function (error, response, body) {
        if (error) {
            //throw new Error(error);
            console.error(body);
        }

        console.log(body);

        res.json(
            JSON.parse(body)
        );
    });

})

app.use(function (err, req, res, next) {
    console.error(err.stack);
    return res.set(err.headers).status(err.status).json({message: err.message});
});

app.listen(3010);
console.log('Listening on http://localhost:3010');
