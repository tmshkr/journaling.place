import { Agenda } from "agenda";
import { registerJobs, scheduleJobs } from "./jobs";

async function run() {
  const agenda = new Agenda({
    db: { address: process.env.MONGO_URI as string },
  });
  registerJobs(agenda);
  await agenda.start();
  console.log("Agenda started");
  scheduleJobs(agenda);
}

run();
