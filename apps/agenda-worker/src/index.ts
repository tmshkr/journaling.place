require("dotenv").config({ path: "../../.env" });
import { Agenda } from "agenda";

async function run() {
  const agenda = new Agenda({
    db: { address: process.env.MONGO_URI as string },
  });
  // registerJobs(agenda);
  agenda.start();
  console.log("Agenda started");
}

run();
