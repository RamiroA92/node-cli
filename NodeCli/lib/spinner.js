const ora = require("ora");
const chalk = require("chalk");
const cliSpinner = require("cli-spinners");

const spinner = ora();
let lastMsg = null;

exports.logWithSpinner = (symbol, msg) => {
  if (!msg) {
    msg = symbol;
    symbol = chalk.green("✔");
  }
  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    });
  }
  spinner.text = " " + msg;
  spinner.spinner = cliSpinner.bouncingBar;
  lastMsg = {
    symbol: symbol + " ",
    text: msg
  };
  spinner.start();
};

exports.stopSpinner = persist => {
  if (lastMsg && persist !== false) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    });
  } else {
    spinner.stop();
  }
  lastMsg = null;
};

exports.pauseSpinner = () => {
  spinner.stop();
};

exports.resumeSpinner = () => {
  spinner.start();
};
