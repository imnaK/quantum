const QUANTUM_PREFIX = "q:";
const QUANTUM_CLASS = "quantum";
const QUANTUM_ENCRYPTION_FILE_NAME = "quantum-keys.enc";
const QUANTUM_ENCRYPTION_DIRECTORY_PATH = path.resolve(
  __dirname,
  "..",
  "quantum"
);

export {
  QUANTUM_PREFIX,
  QUANTUM_CLASS,
  QUANTUM_ENCRYPTION_FILE_NAME,
  QUANTUM_ENCRYPTION_DIRECTORY_PATH,
};
