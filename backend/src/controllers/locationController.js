const dummyLocations = require("../data/dummyLocations");

const getAllLocations = (req, res) => {
  res.status(200).json({
    success: true,
    count: dummyLocations.length,
    data: dummyLocations,
  });
};

module.exports = {
  getAllLocations,
};