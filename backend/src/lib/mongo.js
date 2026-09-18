const mongoose = require('mongoose');

let isConnected = false;
let isConnecting = false;

async function connectToDatabase() {
    if (isConnected || isConnecting) return mongoose.connection;
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');

    isConnecting = true;

    const connectWithRetry = () => {
        console.log('[MongoDB] Attempting connection...');
        mongoose.connect(mongoUri, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }).then(() => {
            isConnected = true;
            isConnecting = false;
            console.log('[MongoDB] Connected successfully.');
        }).catch((error) => {
            console.error('[MongoDB] Connection failed, retrying in 5 seconds...', error.message);
            setTimeout(connectWithRetry, 5000);
        });
    };

    mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected! Attempting to reconnect...');
        isConnected = false;
        if (!isConnecting) {
            isConnecting = true;
            setTimeout(connectWithRetry, 5000);
        }
    });

    // Start initial connection loop but don't await it so the server can start
    connectWithRetry();

    return mongoose.connection;
}

module.exports = { connectToDatabase };
