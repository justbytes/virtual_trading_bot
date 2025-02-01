// Mock external dependencies
jest.mock("node-fetch");

describe("App", () => {
  let app;

  beforeEach(() => {
    app = new App();
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test("should retry fetching agent info when price is zero", async () => {
    // Mock the getAgentInfo method to return zero price first, then valid price
    const mockGetAgentInfo = jest
      .spyOn(app, "getAgentInfo")
      .mockImplementationOnce(() => ({
        data: { price: 0, marketCap: 100 },
      }))
      .mockImplementationOnce(() => ({
        data: { price: 10, marketCap: 100 },
      }));

    const result = await app.someMethodThatUsesGetAgentInfo();

    expect(mockGetAgentInfo).toHaveBeenCalledTimes(2);
    expect(result.data.price).toBe(10);
  });
});
