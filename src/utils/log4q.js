// Console message with prefix
function logWithPrefix(consoleFunction, ...args) {
  const prefix = "[Quantum]";
  const prefixStyle = "color: DeepSkyBlue; font-weight: bolder;";

  // If the first argument is a string and contains "%c", prepend the prefix and reset styles
  if (typeof args[0] === "string" && args[0].includes("%c")) {
    args[0] = `%c${prefix}%c ${args[0]}`;
    args.splice(1, 0, prefixStyle, "");
  } else {
    args.unshift(`%c${prefix}`, prefixStyle);
  }

  consoleFunction(...args);
}

function printExecutionTime(func, label = "execution time") {
  console.time(label);
  const result = func();
  console.timeEnd(label);

  return result;
}

// Log methods like console.log, console.warn, etc. but for Quantum: log4q.log, log4q.warn, etc.
const logMethods = ["log", "warn", "error", "info", "debug"];

// Create an object with the log methods and bind the logWithPrefix function to each one
export default Object.fromEntries([
  ...logMethods.map((method) => [
    method,
    console[method] && logWithPrefix.bind(null, console[method]),
  ]),
  ["printExecutionTime", printExecutionTime],
]);
