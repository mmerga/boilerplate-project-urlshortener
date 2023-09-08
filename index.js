require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const crypto = require('crypto');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
/////////////////////////////////////////////////////////
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  "original_url": { type: String, required: true },
  "short_url": { type: String, required: true }
});

let Url = mongoose.model("Url", urlSchema);

// Cria um obj no BD com as url
const createNewUrl = (originalUrl, shortUrl) => {
  const url = new Url({
    "original_url": originalUrl,
    "short_url": shortUrl
  });
  return url.save(function(err, url) { 
    if (err) {
      return (err);
    }
    return (url);
  });
};

// Acha o shortUrl do BD e retorna o objet
const findShortUrl = (shortUrl, done) => {
  Url.findOne({"short_url": shortUrl}, (err, shortUrl) => {
    if (err) {
      return done(err, null);
    }
    return done(null, shortUrl);
  });
};

// Função para verificar se a URL é válida
function isValidUrl(url) {
  const urlRegex = /^(http:\/\/|https:\/\/)[^ "]+$/;
  return urlRegex.test(url);
}

// Função para gerar um ID curto para a URL
// Algoritimo de hash
// SHA-256 (Secure Hash Algorithm 256 bits
function generateShortUrl(originalUrl) {
  const hash = crypto.createHash('sha256');
  hash.update(originalUrl);
  const shortUrl = hash.digest('hex').slice(0, 8); // 8 digitos 
  return shortUrl;
}

// Gerador de URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  // URL valida ?
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  // ShortUrl
  const shortUrl = generateShortUrl(originalUrl);
  // Armazene a relação entre a URL curta e a URL original
  createNewUrl(originalUrl, shortUrl);
  console.log(originalUrl + ' originalUrl\n ' + shortUrl + ' shortUrl');
  res.json({
    "original_url": originalUrl,
    "short_url": shortUrl 
  });
});

// Rota para redirecionar para a URL original com base na URL curta
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  findShortUrl(shortUrl, (err, done) => {
    if (err) {
      console.error(err); 
      return;  
    }
    if (!done) {
      res.json({ error: 'URL not found' });
      return;
    }  
    res.redirect(done.original_url);
  });
});
