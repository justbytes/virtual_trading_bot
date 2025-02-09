const App = require("./App");
const VirtualTrader = require("./VirtualTrader");

const main = async () => {
  // Initialize the app
  const virtualTrader = await new VirtualTrader().initialize();
  const app = await new App(virtualTrader).initialize();
  let balance = await app.virtualTrader.getBalance(
    "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b"
  );
  // TODO: Create the interactive CLI
  app.virtualTrader.withdrawToken(
    "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
    balance
  );
};

main().catch(console.error);
