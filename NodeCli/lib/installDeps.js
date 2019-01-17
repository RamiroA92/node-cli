const EventEmitter = require("events");
const chalk = require("chalk");
const execa = require("execa");
const readline = require("readline");
const registries = require("./registries");

class InstallProgress extends EventEmitter {
  constructor() {
    super();

    this._progress = -1;
  }

  get progress() {
    return this._progress;
  }

  set progress(value) {
    this._progress = value;
    this.emit("progress", value);
  }

  get enabled() {
    return this._progress !== -1;
  }

  set enabled(value) {
    this.progress = value ? 0 : -1;
  }

  log(value) {
    this.emit("log", value);
  }
}

const progress = (exports.progress = new InstallProgress());

function toStartOfLine(stream) {
  if (!chalk.supportsColor) {
    stream.write("\r");
    return;
  }
  readline.cursorTo(stream, 0);
}

function renderProgressBar(curr, total) {
  const ratio = Math.min(Math.max(curr / total, 0), 1);
  const bar = ` ${curr}/${total}`;
  const availableSpace = Math.max(0, process.stderr.columns - bar.length - 3);
  const width = Math.min(total, availableSpace);
  const completeLength = Math.round(width * ratio);
  const complete = `#`.repeat(completeLength);
  const incomplete = `-`.repeat(width - completeLength);
  toStartOfLine(process.stderr);
  process.stderr.write(`[${complete}${incomplete}]${bar}`);
}

async function addRegistryToArgs(command, args, cliRegistry) {
  const altRegistry = cliRegistry;

  if (altRegistry) {
    args.push(`--registry=${altRegistry}`);
  }
}

function executeCommand(command, args, targetDir) {
  return new Promise((resolve, reject) => {
    const apiMode = null;

    progress.enabled = false;
    const child = execa(command, args, {
      cwd: targetDir,
      stdio: ["inherit", "inherit", "inherit"]
    });

    child.on("close", code => {
      if (code !== 0) {
        reject(`command failed: ${command} ${args.join(" ")}`);
        return;
      }
      resolve();
    });
  });
}

exports.installDeps = async function installDeps(
  targetDir,
  command,
  cliRegistry
) {
  const args = [];
  if (command === "npm") {
    args.push("install", "--loglevel", "error");
  } else {
    throw new Error(`Unknown package manager: ${command}`);
  }

  await addRegistryToArgs(command, args, cliRegistry);
  await executeCommand(command, args, targetDir);
};

exports.installPackage = async function(
  targetDir,
  command,
  cliRegistry,
  packageName,
  dev = true
) {
  const args = [];
  if (command === "npm") {
    args.push("install", "--loglevel", "error");
  } else {
    throw new Error(`Unknown package manager: ${command}`);
  }

  if (dev) args.push("-D");

  await addRegistryToArgs(command, args, cliRegistry);

  args.push(packageName);
  await executeCommand(command, args, targetDir);
};

exports.uninstallPackage = async function(
  targetDir,
  command,
  cliRegistry,
  packageName
) {
  const args = [];
  if (command === "npm") {
    args.push("uninstall", "--loglevel", "error");
  } else {
    throw new Error(`Unknown package manager: ${command}`);
  }

  await addRegistryToArgs(command, args, cliRegistry);

  args.push(packageName);
  await executeCommand(command, args, targetDir);
};

exports.updatePackage = async function(
  targetDir,
  command,
  cliRegistry,
  packageName
) {
  const args = [];
  if (command === "npm") {
    args.push("update", "--loglevel", "error");
  } else if (command === "yarn") {
    args.push("upgrade");
  } else {
    throw new Error(`Unknown package manager: ${command}`);
  }

  await addRegistryToArgs(command, args, cliRegistry);

  packageName.split(" ").forEach(name => args.push(name));
  await executeCommand(command, args, targetDir);
};
