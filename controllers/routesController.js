import axios from "axios";
import { haversineDistance, getGridIndex } from "../scripts/helpers.js";
import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

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
        headers: {
          "User-Agent": "convene-app/1.0 (shreyakakachery@gmail.com)", 
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

async function getStopsWithRoutes(latIndex, lonIndex) {
  try {
    const stops = await knex("stops")
      .select(
        "stop_id",
        "stop_code",
        "stop_name",
        "stop_lat",
        "stop_lon",
        "zone_id"
      )
      .where({ lat_index: latIndex, lon_index: lonIndex }); // for future: change to .wherebetween after re-seeding the data with 0.005 gridsize
    // .whereBetween("lat_index", [latIndex - 1, latIndex + 1])
    // .whereBetween("lon_index", [lonIndex - 1, lonIndex + 1]);

    let expandedStops = [];

    for (const stop of stops) {
      const routes = await knex("routes")
        .select("route_name")
        .where("stop_id", stop.stop_id);

      if (!routes) {
        console.warn(`No routes found`);
      }

      routes.forEach((route) => {
        expandedStops.push({
          ...stop,
          route: route.route_name,
        });
      });
    }

    return expandedStops;
  } catch (error) {
    console.error("Error fetching stops with routes:", error.message);
    return [];
  }
}

async function filterClosestStopsByRoute(stops, inputLat, inputLon) {
  stops.forEach((stop) => {
    stop.distance = haversineDistance(
      inputLat,
      inputLon,
      stop.stop_lat,
      stop.stop_lon
    );
  });

  const stopsByRoute = stops.reduce((acc, stop) => {
    const route = stop.route;
    if (!acc[route]) acc[route] = [];
    acc[route].push(stop);
    return acc;
  }, {});

  const closestStops = [];
  for (const route in stopsByRoute) {
    const stopsGroup = stopsByRoute[route];

    stopsGroup.sort((a, b) => a.distance - b.distance);

    closestStops.push(stopsGroup[0]);
  }

  const filteredStops = closestStops.filter(
    (stop) => !stop.route.startsWith("N")
  );

  return filteredStops;
}

export { getCoordinates, getStopsWithRoutes, filterClosestStopsByRoute };
