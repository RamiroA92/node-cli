#!/usr/bin/env node
const program = require("commander");

program
  .version(require("../package.json").version)
  .usage("<command> [options]");

program
  .command("create <app-name>")
  .description("create a new project using the gulf boiler plate")
  .option(
    "-f, --form <form-name>",
    "Creates a new form derived from the boiler plate"
  )
  .action((name, cmd) => {
    const options = cleanArgs(cmd);
    require("../lib/create")(name, options);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// output help information on unknown commands
program.arguments("<command>").action(cmd => {
  program.outputHelp();
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  console.log();
});

// add some useful info on help
program.on("--help", () => {
  console.log();
  console.log(
    `  Run ${chalk.cyan(
      `gulf <command> --help`
    )} for detailed usage of given command.`
  );
  console.log();
});

program.commands.forEach(c => c.on("--help", () => console.log()));

function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

function cleanArgs(cmd) {
  const args = {};
  cmd.options.forEach(o => {
    const key = camelize(o.long.replace(/^--/, ""));
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== "function" && typeof cmd[key] !== "undefined") {
      args[key] = cmd[key];
    }
  });
  return args;
}
