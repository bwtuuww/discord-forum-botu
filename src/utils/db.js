const mongoose = require('mongoose');
const { mongodbUri } = require('../config');

async function connectToDatabase() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('MongoDB veritabanına başarıyla bağlanıldı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
}

module.exports = { connectToDatabase }; 