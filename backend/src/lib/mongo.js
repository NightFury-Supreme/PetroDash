const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase() {
    if (isConnected) return mongoose.connection;
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(mongoUri, {
        autoIndex: true,
    });
    isConnected = true;
    return mongoose.connection;
}

module.exports = { connectToDatabase };



