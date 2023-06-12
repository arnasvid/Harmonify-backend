import * as cron from "node-cron";

const scrobbleJobScheduler = (scrobbleJob: () => void) => {
  // schedule job every 20 minutes
  cron.schedule("*/20 * * * *", () => {
    scrobbleJob();
  });
};

export default scrobbleJobScheduler;
