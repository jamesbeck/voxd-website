import db from "@/database/db";

interface WorkerRun {
  id: string;
  scheduledFor: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  workerName: string;
  sessionId: string;
  runStatus: string;
  runResult: string | null;
  error: string | null;
  userData: Record<string, any> | null;
  sessionData: Record<string, any> | null;
  workerData: Record<string, any> | null;
  createdAt: Date;
}

const getWorkerRunById = async ({
  workerRunId,
}: {
  workerRunId: string;
}): Promise<WorkerRun | null> => {
  const workerRun = await db("workerRun").where("id", workerRunId).first();

  if (!workerRun) return null;

  return workerRun;
};

export default getWorkerRunById;
