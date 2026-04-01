import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

const CALENDAR_NAME = "Life Scheduler";

function escapeAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatAppleScriptDate(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${h12}:${minutes} ${ampm}`;
}

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await exec("osascript", ["-e", script]);
  return stdout.trim();
}

export async function ensureCalendarExists(): Promise<void> {
  const script = `
tell application "Calendar"
  set calNames to name of every calendar
  if calNames does not contain "${CALENDAR_NAME}" then
    set newCal to make new calendar with properties {name:"${CALENDAR_NAME}"}
  end if
end tell`;
  await runAppleScript(script);
}

export async function createCalendarEvent(params: {
  title: string;
  description: string;
  startDate: Date;
  durationMins: number;
}): Promise<void> {
  const { title, description, startDate, durationMins } = params;
  const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

  const script = `
tell application "Calendar"
  tell calendar "${CALENDAR_NAME}"
    make new event with properties {summary:"${escapeAppleScript(title)}", description:"${escapeAppleScript(description)}", start date:date "${formatAppleScriptDate(startDate)}", end date:date "${formatAppleScriptDate(endDate)}"}
  end tell
end tell`;
  await runAppleScript(script);
}

type TaskData = {
  title: string;
  description: string | null;
  scheduledDate: Date | string | null;
  startHour: number | null;
  estimatedMins: number | null;
};

type MilestoneData = {
  title: string;
  tasks: TaskData[];
};

type GoalData = {
  title: string;
  milestones: MilestoneData[];
};

export async function addPlanToCalendar(goal: GoalData): Promise<number> {
  await ensureCalendarExists();

  let eventCount = 0;

  for (const milestone of goal.milestones) {
    for (const task of milestone.tasks) {
      if (!task.scheduledDate) continue;

      const startDate = new Date(task.scheduledDate);
      startDate.setHours(task.startHour ?? 8, 0, 0, 0);

      const description = [
        task.description || "",
        `Goal: ${goal.title}`,
        `Milestone: ${milestone.title}`,
      ]
        .filter(Boolean)
        .join("\n");

      await createCalendarEvent({
        title: task.title,
        description,
        startDate,
        durationMins: task.estimatedMins || 30,
      });
      eventCount++;
    }
  }

  return eventCount;
}
