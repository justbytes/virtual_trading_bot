const App = require("./App");
const VirtualTrader = require("./VirtualTrader");

const main = async () => {
  // Initialize the app
  const virtualTrader = await new VirtualTrader().initialize();
  const app = await new App(virtualTrader).initialize();

  const amount = 1e18;

  // TODO: Create the interactive CLI
  app.virtualTrader.buy("0x0A32C7fc74A35a9BFd99623C2aF309BB9469733E", amount);
};

main().catch(console.error);
