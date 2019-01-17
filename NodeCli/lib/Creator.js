const fs = require("fs-extra");
const util = require("util");
const chalk = require("chalk");
const EventEmitter = require("events");
const Listr = require("listr");
const execa = require("execa");
const _ = require("lodash");
const Constants = require("../constants/Constants");
const { log, info, warn, error } = require("./logger");
const { logWithSpinner, stopSpinner } = require("./spinner");
const { installDeps } = require("./installDeps");

module.exports = class Creator extends EventEmitter {
  constructor(name, context) {
    super();

    this.name = name;
    this.context = context;
    this.run = this.run.bind(this);
  }

  async create(cliOptions = {}) {
    await this.run();
  }

  async copyFiles(currDir, targetDir) {
    const { context } = this;
    try {
      await fs.copy(Constants.localRepoPath, `${context}`);
      return Constants.success;
    } catch (err) {
      console.log(`${chalk.red(err)}`);
      return err;
    }
  }

  async readFile(file) {
    const readFile = util.promisify(fs.readFile);
    return await readFile(file);
  }

  async run() {
    const { context } = this;
    // Clone Repo
    logWithSpinner(`${chalk.cyan(">")}`, `Copying files from repository...`);
    this.emit("creation", { event: "cloning" });
    await this.copyFiles();
    stopSpinner();

    // Changing Files
    log(`${chalk.cyan(">")}  File Renaming Process`);
    log();
    await this.editProjectFiles();

    // Installing Dependencies
    log(
      `${chalk.cyan(">")}  Installing CLI plugins. This might take a while...`
    );
    log();
    this.emit("creation", { event: "plugins-install" });
    await installDeps(context, "npm");

    // Launch Server
    log(`${chalk.cyan(">")}  npm run serve`);
    await this.runServer();
  }

  async editProjectFiles() {
    return new Listr([this.editPkg(), this.editBoilerPlateService()]).run();
  }

  editPkg() {
    const { context, name } = this;

    return {
      title: "Changing 'package.json'",
      task: async () => {
        let buffer = await this.readFile(`${context}/package.json`);
        let json = JSON.parse(buffer);
        json.name = `${name}`;
        fs.writeJSON(`${context}/package.json`, json);
      }
    };
  }

  editBoilerPlateService() {
    const { context, name } = this;

    return {
      title: `Configuring src/service/BoilerPlateService.js`,
      task: async () => {
        const className = _.upperFirst(_.camelCase(name));
        const servicePath = `${context}/${Constants.servicePath}`;
        let fileStr = await this.readFile(
          `${context}/${Constants.servicePath}`
        );

        fileStr = fileStr.toString("utf8");
        fileStr = _.replace(
          fileStr,
          new RegExp("BoilerplateService", "g"),
          className
        );

        await fs.writeFile(`${servicePath}`, fileStr);

        const newFileName = _.replace(
          servicePath,
          "BoilerplateService.js",
          `${className}Service.js`
        );

        await fs.rename(`${servicePath}`, `${newFileName}`);
      }
    };
  }

  async runServer() {
    return execa("npm", ["run", "serve"], {
      cwd: `${this.context}/src`,
      stdio: ["inherit", "inherit", "inherit"]
    });
  }
};
