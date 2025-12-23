import { Registry } from "./registry";
import todaysJobsWidget from "../widgets/todays-jobs.widget";
import inboxWidget from "../widgets/inbox.widget";
import reportedDefectsWidget from "../widgets/reported-defects.widget";

export const registry = new Registry();

registry.register(todaysJobsWidget);
registry.register(inboxWidget);
registry.register(reportedDefectsWidget);
