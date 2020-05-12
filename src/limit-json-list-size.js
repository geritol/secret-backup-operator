const getJsonByteSize = (value) =>
  Buffer.byteLength(JSON.stringify(value), "utf8");

module.exports = (list, sizeLimit) => {
  if (sizeLimit < getJsonByteSize([])) {
    throw new RangeError("Size limit is below the minimum list size");
  }

  return list.filter(
    (_, index) => getJsonByteSize(list.slice(0, index + 1)) <= sizeLimit
  );
};
