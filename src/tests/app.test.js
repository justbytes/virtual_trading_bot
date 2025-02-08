const { ethers } = require("ethers");
const App = require("../App");

// Mock external dependencies
jest.mock("node-fetch");

describe("App", () => {
  let app;

  beforeEach(async () => {
    // Mock the virtualTrader
    const mockVirtualTrader = {
      getBalance: jest.fn(),
    };

    app = await new App(mockVirtualTrader).initialize();
    jest.clearAllMocks();
  });

  describe("getAmountToTrade", () => {
    test("should return false when there are 4 or more active trades", async () => {
      app.activeTrades = new Map([
        ["token1", {}],
        ["token2", {}],
        ["token3", {}],
        ["token4", {}],
      ]);

      const result = await app.getAmountToTrade();

      expect(result).toBe(false);
    });

    test("should return 25% of balance in wei", async () => {
      const mockBalanceInWei = ethers.utils.parseEther("100"); // 100 tokens
      app.virtualTrader.getBalance.mockReturnValue(mockBalanceInWei);
      app.activeTrades = new Map(); // No active trades

      const expectedAmount = ethers.utils.parseEther("25");

      const result = await app.getAmountToTrade();

      expect(result.toString()).toBe(expectedAmount.toString());
      expect(app.virtualTrader.getBalance).toHaveBeenCalledWith(
        expect.any(String)
      );
    });

    test("should handle small balances correctly", async () => {
      const mockBalanceInWei = ethers.utils.parseEther("1"); // 1 token
      app.virtualTrader.getBalance.mockReturnValue(mockBalanceInWei);
      app.activeTrades = new Map();

      const expectedAmount = ethers.utils.parseEther("0.25");

      const result = await app.getAmountToTrade();

      expect(result.toString()).toBe(expectedAmount.toString());
    });
  });
});
