export type LogEntry = {
  timestamp: string;
  message: string;
};

const MAX_ENTRIES = 200;
const buffer: LogEntry[] = [];

function push(message: string) {
  if (buffer.length >= MAX_ENTRIES) buffer.shift();
  buffer.push({ timestamp: new Date().toISOString(), message });
}

function format(args: unknown[]): string {
  return args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
}

export function log(...args: unknown[]) {
  const msg = format(args);
  push(msg);
  console.log(msg);
}

export function logError(...args: unknown[]) {
  const msg = format(args);
  push(msg);
  console.error(msg);
}

export function getLogs(): LogEntry[] {
  return [...buffer];
}
