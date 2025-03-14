import axios from "axios";
import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

// Helper function to calculate grid index
function getGridIndex(lat, lon) {
  const gridSize = 0.009;
  return {
    latIndex: Math.floor(lat / gridSize),
    lonIndex: Math.floor(lon / gridSize),
  };
}

// Helper function to get coordinates and grid indices
async function getCoordinates(address) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
      }
    );

    if (response.data.length === 0) {
      throw new Error("No results found for this address");
    }

    const location = response.data[0];
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    const { latIndex, lonIndex } = getGridIndex(lat, lon);

    return { address, lat, lon, latIndex, lonIndex };
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return null;
  }
}

// Helper function to get nearby stops and routes ROUTES STRING WITH MULTIPLE STOPS
async function getStopsWithRoutes(latIndex, lonIndex) {
  try {
    const stops = await knex("stops")
      .select("stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon")
      .where({ lat_index: latIndex, lon_index: lonIndex }); // can change to .wherebetween after i reseed the data with 0.005 gridsize
    //   .whereBetween("lat_index", [latIndex - 1, latIndex + 1])
    //   .whereBetween("lon_index", [lonIndex - 1, lonIndex + 1]);

    let expandedStops = [];

    for (const stop of stops) {
      const routes = await knex("routes")
        .select("route_name")
        .where("stop_id", stop.stop_id);

      if (!routes || routes.length === 0) {
        console.warn(`No routes found for stop_id: ${stop.stop_id}`);
        continue; // Skip to next stop
      }

      routes.forEach((route) => {
        expandedStops.push({
          ...stop,
          route: route.route_name, // Single route instead of an array
        });
      });
    }

    return expandedStops;
  } catch (error) {
    console.error("Error fetching stops with routes:", error.message);
    return [];
  }
}

// using JOIN but there is some issue with the route name
// async function getStopsWithRoutes(latIndex, lonIndex) {
//   try {
//     const stops = await knex("stops")
//       .join("routes", "stops.stop_id", "routes.stop_id") // Join the routes table with stops
//       .select(
//         "stops.stop_id",
//         "stops.stop_code",
//         "stops.stop_name",
//         "stops.stop_lat",
//         "stops.stop_lon",
//         "routes.route_name"
//       )
//       .where({ lat_index: latIndex, lon_index: lonIndex });

//     return stops.map((stop) => ({
//       ...stop,
//       route: stop.route_name, // Directly assign route_name to stop
//     }));
//   } catch (error) {
//     console.error("Error fetching stops with routes:", error.message);
//     return [];
//   }
// }

// Helper function to calculate the Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function filterClosestStopsByRoute(stops, inputLat, inputLon) {
  // 1️⃣ Compute distance for each stop
  stops.forEach((stop) => {
    stop.distance = haversineDistance(
      inputLat,
      inputLon,
      stop.stop_lat,
      stop.stop_lon
    );
  });

  // 2️⃣ Group stops by route
  const stopsByRoute = stops.reduce((acc, stop) => {
    const route = stop.route;
    if (!acc[route]) acc[route] = [];
    acc[route].push(stop);
    return acc;
  }, {});

  // 3️⃣ For each route, keep only the closest stop
  const closestStops = [];
  for (const route in stopsByRoute) {
    const stopsGroup = stopsByRoute[route];

    // Sort the stops by distance (closest to farthest)
    stopsGroup.sort((a, b) => a.distance - b.distance);

    // Add the closest stop for this route
    closestStops.push(stopsGroup[0]);
  }

  //   return closestStops;

  // 4️⃣ Filter out routes that start with "N" from the closestStops
  const filteredStops = closestStops.filter(
    (stop) => !stop.route.startsWith("N")
  );

  return filteredStops;
}

export { getCoordinates, getStopsWithRoutes, filterClosestStopsByRoute };
