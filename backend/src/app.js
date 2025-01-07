require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussiee o/// !'))
  .catch(() => console.log('Connexion à MongoDB échouée :(((( !'));

const app = express();

app.use((req, res, next) => {
  console.log('server ok!');
});

module.exports = app;
