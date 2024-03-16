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

const log = logWithPrefix.bind(null, console.log);
const warn = logWithPrefix.bind(null, console.warn);
const error = logWithPrefix.bind(null, console.error);

function printExecutionTime(aFunction, label = "execution time") {
  console.time(label);

  const result = aFunction();

  console.timeEnd(label);

  return result;
}

export default { log, warn, error, printExecutionTime };
