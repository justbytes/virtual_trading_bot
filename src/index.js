const App = require("./app");

const main = async () => {
  // Initialize the app
  const app = await new App().initialize();

  // TODO: Create the interactive CLI
};

main().catch(console.error);
