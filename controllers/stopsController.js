import axios from "axios";
import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

// Haversine distance calculation
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Controller function for handling stop route logic
export const getStops = async (req, res) => {
  try {
    const { routeA, originStopA, routeB, originStopB } = req.query; // Extract query params

    if (!routeA || !originStopA || !routeB || !originStopB) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Get route stops for Route A
    const routeStopsA = await knex("routes")
      .where("route_name", routeA)
      .andWhere(
        "stop_sequence",
        ">=",
        knex("routes")
          .select("stop_sequence")
          .where("route_name", routeA)
          .andWhere("stop_id", originStopA)
      );

    // Get route stops for Route B
    const routeStopsB = await knex("routes")
      .where("route_name", routeB)
      .andWhere(
        "stop_sequence",
        ">=",
        knex("routes")
          .select("stop_sequence")
          .where("route_name", routeB)
          .andWhere("stop_id", originStopB)
      );

    // Extract all stop IDs from both routes
    const stopIdsA = routeStopsA.map((stop) => stop.stop_id);
    const stopIdsB = routeStopsB.map((stop) => stop.stop_id);
    const allStopIds = [...new Set([...stopIdsA, ...stopIdsB])]; // Remove duplicates

    // Get stop details from "stops" table for all stop IDs
    const stopDetails = await knex("stops")
      .whereIn("stop_id", allStopIds)
      .select(
        "stop_id",
        "stop_code",
        "stop_name",
        "stop_lat",
        "stop_lon",
        "lat_index",
        "lon_index",
        "zone_id"
      );

    // Merge stop details into the routeStopsA and routeStopsB arrays
    const enrichedStopsA = routeStopsA.map((stop) => {
      const stopInfo = stopDetails.find((s) => s.stop_id === stop.stop_id);
      return {
        ...stop, // Keep existing route stop info
        ...stopInfo, // Add stop details
      };
    });

    const enrichedStopsB = routeStopsB.map((stop) => {
      const stopInfo = stopDetails.find((s) => s.stop_id === stop.stop_id);
      return {
        ...stop, // Keep existing route stop info
        ...stopInfo, // Add stop details
      };
    });

    // Combine both enriched stops into one array
    const combinedStops = [...enrichedStopsA, ...enrichedStopsB];

    // Group stops by grid coordinates
    const groupStopsByGrid = (stops) => {
      const groupedStops = {};
      stops.forEach((stop) => {
        const key = `${stop.lat_index}_${stop.lon_index}`;
        if (!groupedStops[key]) {
          groupedStops[key] = [];
        }
        groupedStops[key].push(stop);
      });
      return groupedStops;
    };

    const stopPairs = groupStopsByGrid(combinedStops);

    // Filter stop pairs where there are more than one unique route
    const filteredStopPairs = Object.fromEntries(
      Object.entries(stopPairs).filter(([key, value]) => {
        const uniqueRoutes = [...new Set(value.map((stop) => stop.route_name))];
        return uniqueRoutes.length > 1; // Keep only groups with more than one unique route
      })
    );

    // Now, find closest pairs for each group (after filtering)
    const closestStopPairs = {};

    Object.entries(filteredStopPairs).forEach(([key, value]) => {
      // Group stops by route name
      const routeAStops = value.filter((stop) => stop.route_name === routeA);
      const routeBStops = value.filter((stop) => stop.route_name === routeB);

      closestStopPairs[key] = [];

      // For each stop in Route A, find the closest stop in Route B
      routeAStops.forEach((stopA) => {
        let closestStopB = null;
        let minDistance = Infinity;

        routeBStops.forEach((stopB) => {
          const distance = haversineDistance(
            stopA.stop_lat,
            stopA.stop_lon,
            stopB.stop_lat,
            stopB.stop_lon
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestStopB = stopB; // Store closest stop from routeB
          }
        });

        // Add closest pair (Route A stop and the closest Route B stop)
        if (closestStopB) {
          closestStopPairs[key].push({
            routeA_stop: stopA,
            routeB_stop: closestStopB,
            distance: minDistance,
          });
        }
      });
    });

    res.json(closestStopPairs);
  } catch (error) {
    console.error("Error in /stops endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
