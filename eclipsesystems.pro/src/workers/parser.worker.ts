import { expose } from "comlink";
import { parseDocument } from "@core/parser";
import type { ParseMode, ParseResult } from "@core/types";

let latestJob = 0;

const api = {
  async parse(text: string, mode: ParseMode, jobId: number): Promise<ParseResult | null> {
    latestJob = Math.max(latestJob, jobId);
    await Promise.resolve();
    if (jobId < latestJob) return null;
    const result = parseDocument(text, mode);
    return jobId < latestJob ? null : result;
  },
  cancel(jobId: number) {
    latestJob = Math.max(latestJob, jobId);
  }
};

export type ParserWorkerApi = typeof api;

expose(api);
