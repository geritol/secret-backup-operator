const start = require("./start");

describe("operator/start", () => {
  it("starts without errors", async () => {
    const operator = await start();

    operator.stop();
  });
});
