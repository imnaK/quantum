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

const methods = ["log", "warn", "error", "info", "debug"];
const log4q = {};

for (let method of methods) {
  console[method] &&
    (log4q[method] = logWithPrefix.bind(null, console[method]));
}

export default log4q;
