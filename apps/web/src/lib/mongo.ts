import { MongoClient } from "mongodb";
// In development mode, use a global variable so that the value
// is preserved across module reloads caused by HMR (Hot Module Replacement).
const globalWithMongo = global as typeof globalThis & {
  _mongoClient: MongoClient;
};

export const mongoClient = getMongoClient();

function getMongoClient() {
  if (globalWithMongo._mongoClient) {
    return globalWithMongo._mongoClient;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not available.");
  }

  const client = new MongoClient(uri);
  client.connect().then(() => {
    console.log("Connected to MongoDB");
  });

  if (process.env.NODE_ENV === "development") {
    globalWithMongo._mongoClient = client;
  }

  return client;
}
