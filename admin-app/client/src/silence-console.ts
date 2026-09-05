const methods = [
  "log", "error", "warn", "info", "debug", "trace", "dir", "dirxml",
  "table", "group", "groupCollapsed", "groupEnd", "time", "timeLog",
  "timeEnd", "count", "countReset", "assert", "clear", "profile",
  "profileEnd", "timeStamp",
];

for (const method of methods) {
  (console as any)[method] = () => undefined;
}