import { exchange } from "@modules/authentication";
import { QUANTUM_PREFIXES } from "@utils/constants";

String.prototype.getQuantumMessage = function (prefixes = QUANTUM_PREFIXES, tasks = exchange.TASKS) {
  for (let prefix of prefixes) {
    for (let task of tasks) {
      const prefixAndTask = prefix + task;
      if (this.startsWith(prefixAndTask)) {
        return {
          prefix: prefix,
          task: task,
          content: this.substring(prefixAndTask.length),
        };
      }
      if (this.startsWith(prefix)) {
        return {
          prefix: prefix,
          content: this.substring(prefix.length),
        };
      }
    }
  }
  return false;
};
