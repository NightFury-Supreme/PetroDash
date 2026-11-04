const mongoose = require('mongoose');

mongoose.plugin((schema) => {
    schema.set('versionKey', false);
});

let isConnected = false;
let connectionPromise = null;

async function connectToDatabase(retries = 5, delayMs = 1500) {
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');

    const connectWithRetry = async (attempt = 1) => {
        try {
            return await mongoose.connect(mongoUri, {
                autoIndex: true,
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 45000,
                maxPoolSize: 200,
                minPoolSize: 20,
                maxIdleTimeMS: 30000,
            });
        } catch (err) {
            if (attempt < retries) {
                const wait = delayMs * attempt;
                process.stderr.write(`[MongoDB] Connection attempt ${attempt}/${retries} failed (${err.message}). Retrying in ${wait}ms...\n`);
                await new Promise((resolve) => setTimeout(resolve, wait));
                return connectWithRetry(attempt + 1);
            }
            throw err;
        }
    };

    connectionPromise = connectWithRetry()
        .then((conn) => {
            isConnected = true;
            return conn;
        })
        .catch((err) => {
            isConnected = false;
            connectionPromise = null;
            throw err;
        });

    mongoose.connection.on('disconnected', () => {
        isConnected = false;
        connectionPromise = null;
    });

    return connectionPromise;
}

module.exports = { connectToDatabase };
