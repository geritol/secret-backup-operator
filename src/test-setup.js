const chai = require("chai");

chai.use(require("chai-subset"));
chai.use(require("sinon-chai"));

module.exports = { expect: chai.expect };
