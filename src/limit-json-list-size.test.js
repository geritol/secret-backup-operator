const limitJsonListSize = require("./limit-json-list-size");
const { expect } = require("./test-setup");

describe("limit-json-list-size", () => {
  it("should return the list if it is below the limit", () => {
    const result = limitJsonListSize([], 2);
    expect(result).to.deep.equal([]);
  });

  it("should remove parts exceeding the limit", () => {
    const result = limitJsonListSize([1, 2, 3], 3);
    expect(result).to.deep.equal([1]);
  });

  it("should return a list that is at most the size limit when stringified", () => {
    const sizeLimit = 4;

    const result = limitJsonListSize([1, 2, 3], sizeLimit);

    const resultSize = Buffer.byteLength(JSON.stringify(result), "utf8");
    expect(resultSize).to.be.at.most(sizeLimit);
  });

  it("should throw an error when size limit is below the size of an empty list", () => {
    expect(() => limitJsonListSize([1], 1)).to.throw(RangeError);
  });
});
