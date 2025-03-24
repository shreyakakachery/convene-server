import express from "express";
import {
  getCoordinates,
  getStopsWithRoutes,
  filterClosestStopsByRoute,
} from "../controllers/routesController.js";

const router = express.Router();

const getFilteredStopsForAddress = async (address) => {
  const addressInfo = await getCoordinates(address);
  if (!addressInfo) {
    return null;
  }

  const stops = await getStopsWithRoutes(
    addressInfo.latIndex,
    addressInfo.lonIndex
  );
  return await filterClosestStopsByRoute(
    stops,
    addressInfo.lat,
    addressInfo.lon
  );
};

router.get("/", async (req, res) => {
  try {
    const { locA, locB } = req.query;

    if (!locA || !locB) {
      return res.status(400).send("Both locA and locB are required.");
    }

    const filteredStopsA = await getFilteredStopsForAddress(locA);
    const filteredStopsB = await getFilteredStopsForAddress(locB);

    if (!filteredStopsA || !filteredStopsB) {
      return res
        .status(404)
        .send("Could not retrieve stops for one of the addresses.");
    }

    res.status(200).json([
      {
        address: locA,
        filteredStops: filteredStopsA,
      },
      {
        address: locB,
        filteredStops: filteredStopsB,
      },
    ]);
  } catch (error) {
    console.error("Error in /routes endpoint:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
