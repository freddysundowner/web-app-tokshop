const silentConsoleMethods = [
  "log",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "dir",
  "dirxml",
  "table",
  "group",
  "groupCollapsed",
  "groupEnd",
  "time",
  "timeLog",
  "timeEnd",
  "count",
  "countReset",
  "assert",
  "clear",
  "profile",
  "profileEnd",
  "timeStamp",
] as const;

for (const method of silentConsoleMethods) {
  if (typeof console[method] === "function") {
    (console as any)[method] = () => undefined;
  }
}