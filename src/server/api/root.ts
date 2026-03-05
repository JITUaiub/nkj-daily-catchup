import { createTRPCRouter } from "@/server/api/trpc";
import { taskRouter } from "./routers/task";
import { projectRouter } from "./routers/project";
import { timeRouter } from "./routers/time";
import { followUpRouter } from "./routers/follow-up";
import { noteRouter } from "./routers/note";
import { meetingRouter } from "./routers/meeting";

export const appRouter = createTRPCRouter({
  task: taskRouter,
  project: projectRouter,
  time: timeRouter,
  followUp: followUpRouter,
  note: noteRouter,
  meeting: meetingRouter,
});

export type AppRouter = typeof appRouter;
