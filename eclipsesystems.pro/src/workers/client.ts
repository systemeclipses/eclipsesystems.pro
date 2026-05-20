import { wrap, type Remote } from "comlink";
import type { ParseMode, ParseResult } from "@core/types";
import ParserWorker from "./parser.worker?worker";
import type { ParserWorkerApi } from "./parser.worker";

let worker: Worker | null = null;
let api: Remote<ParserWorkerApi> | null = null;
let jobId = 0;
let debounceTimer: number | undefined;

function getApi() {
  if (!worker) {
    worker = new ParserWorker();
    api = wrap<ParserWorkerApi>(worker);
  }
  return api;
}

export function parseInWorker(
  text: string,
  mode: ParseMode,
  debounceMs = 120
): Promise<ParseResult | null> {
  const currentJob = (jobId += 1);
  if (debounceTimer) window.clearTimeout(debounceTimer);

  return new Promise((resolve) => {
    debounceTimer = window.setTimeout(() => {
      void getApi()
        ?.parse(text, mode, currentJob)
        .then(resolve);
    }, debounceMs);
  });
}

export function cancelParses() {
  const currentJob = (jobId += 1);
  void getApi()?.cancel(currentJob);
}
