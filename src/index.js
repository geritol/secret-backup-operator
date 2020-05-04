const Operator = require("./operator");

const main = async () => {
  const operator = new Operator();
  await operator.start();

  console.log("Secret operator running");

  const exit = () => {
    operator.stop();
    process.exit(0);
  };

  process
    .on("SIGTERM", () => exit("SIGTERM"))
    .on("SIGINT", () => exit("SIGINT"));
};

main();
