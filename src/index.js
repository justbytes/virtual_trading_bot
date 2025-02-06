const App = require("./App");
const VirtualTrader = require("./VirtualTrader");

const main = async () => {
  // Initialize the app
  const virtualTrader = await new VirtualTrader().initialize();
  const app = await new App(virtualTrader).initialize();

  // TODO: Create the interactive CLI
};

main().catch(console.error);
