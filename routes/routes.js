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

  const filteredStops = await filterClosestStopsByRoute(
    stops,
    addressInfo.lat,
    addressInfo.lon
  );

  return {
    lat: addressInfo.lat,
    lon: addressInfo.lon,
    filteredStops,
  };
};

router.get("/", async (req, res) => {
  try {
    const { locA, locB } = req.query;

    if (!locA || !locB) {
      return res.status(400).send("Both locA and locB are required.");
    }

    const resultA = await getFilteredStopsForAddress(locA);
    const resultB = await getFilteredStopsForAddress(locB);

    if (!resultA || !resultB) {
      return res
        .status(404)
        .send("Could not retrieve stops for one of the addresses.");
    }

    res.status(200).json([
      {
        address: locA,
        lat: resultA.lat,
        lon: resultA.lon,
        filteredStops: resultA.filteredStops,
      },
      {
        address: locB,
        lat: resultB.lat,
        lon: resultB.lon,
        filteredStops: resultB.filteredStops,
      },
    ]);
  } catch (error) {
    console.error("Error in /routes endpoint:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
