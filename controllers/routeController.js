import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

export const getFilteredStops = async (req, res) => {
  try {
    const { routeName, stopId } = req.query;

    if (!routeName || !stopId) {
      return res
        .status(400)
        .json({ error: "Missing required parameters: routeName and stopId" });
    }

    const routeStops = await knex("routes")
      .where("route_name", routeName)
      .orderBy("stop_sequence", "asc");

    if (routeStops.length === 0) {
      return res.status(404).json({ error: "No stops found for this route" });
    }

    const stopIndex = routeStops.findIndex((stop) => stop.stop_id == stopId);
    if (stopIndex === -1) {
      return res.status(404).json({ error: "Stop ID not found on this route" });
    }

    const filteredStops = routeStops.slice(stopIndex);

    const stopIds = filteredStops.map((stop) => stop.stop_id);
    const stopDetails = await knex("stops")
      .whereIn("stop_id", stopIds)
      .select("stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon");

    const enrichedStops = filteredStops.map((routeStop) => {
      const stopInfo = stopDetails.find((s) => s.stop_id === routeStop.stop_id);
      return {
        stop_id: routeStop.stop_id,
        stop_name: stopInfo?.stop_name || "Unknown",
        stop_code: stopInfo?.stop_code || null,
        stop_lat: stopInfo?.stop_lat || null,
        stop_lon: stopInfo?.stop_lon || null,
        stop_sequence: routeStop.stop_sequence,
      };
    });

    res.status(200).json(enrichedStops);
  } catch (error) {
    console.error("Error fetching filtered stops:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
