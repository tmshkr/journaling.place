import { MongoClient } from "mongodb";
export const mongoClient = new MongoClient(process.env.MONGO_URI as string);
mongoClient.connect().then(() => {
  console.log("Connected to MongoDB");
});
