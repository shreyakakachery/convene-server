import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
const app = express();
import initKnex from "knex";
import configuration from "./knexfile.js";
const knex = initKnex(configuration);
import placesRouter from "./routes/places.js"; 
import routesRouter from "./routes/routes.js"; 

const PORT = process.env.PORT || 5050;
const BACKEND_URL = process.env.BACKEND_URL;

// middleware to parse req.body
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Welcome to the Convene's Backend Server");
});

// get an array of stops!
// app.get("/routes", async (_req, res) => {
//   try {
//     const data = await knex.select("*").from("routes").limit(2);
//     res.json(data);
//   } catch {
//     res.status(500).send("Error getting routes");
//   }
// });

app.get("/stops", async (_req, res) => {
  try {
    const data = await knex.select("*").from("stops").limit(2);
    res.json(data);
  } catch {
    res.status(500).send("Error getting stops");
  }
});

app.use("/routes", routesRouter);
app.use("/places", placesRouter);









/////////////////////////////////////////////////////////////////////////////////////////////
// helper function testing! 

// Helper function to calculate grid index (example logic)
function getGridIndex(lat, lon) {
  const gridSize = 0.009; // Adjust this based on your needs
  return {
    latIndex: Math.floor(lat / gridSize),
    lonIndex: Math.floor(lon / gridSize)
  };
}


// Helper function to get coordinates and grid indices
async function getCoordinates(address) {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1
      }
    });

    if (response.data.length === 0) {
      throw new Error("No results found for this address");
    }

    const location = response.data[0];
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    // Get grid index based on lat & lon
    const { latIndex, lonIndex } = getGridIndex(lat, lon);

    return {
      address, // Original input address
      lat,
      lon,
      latIndex,
      lonIndex
    };
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return null;
  }
}


// Example Usage
// getCoordinates("3551 Foster Avenue").then((result) => console.log(result));



// Helper function to get nearby stops and routes
async function getStopsWithRoutes(latIndex, lonIndex) {
  try {
    // Fetch stops from the stops table
    const stops = await knex("stops")
      .select("stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon")
      .where({ lat_index: latIndex, lon_index: lonIndex });
      // .whereBetween("lat_index", [latIndex - 1, latIndex + 1])
      // .whereBetween("lon_index", [lonIndex - 1, lonIndex + 1]);

    // Fetch associated route names for each stop
    const stopsWithRoutes = await Promise.all(
      stops.map(async (stop) => {
        const routes = await knex("routes")
          .select("route_name")
          .where("stop_id", stop.stop_id);

        return {
          ...stop,
          routes: routes.map((route) => route.route_name) // Extracting only route names
        };
      })
    );

        //  // Log all route names for unfiltered stops
        // const allRouteNames = stopsWithRoutes.map(stop => stop.routes).flat();
        // console.log("All Route Names (Unfiltered Stops):", allRouteNames);

    return stopsWithRoutes;
  } catch (error) {
    console.error("Error fetching stops with routes:", error.message);
    return [];
  }
}

// Example Usage
// getStopsWithRoutes(5470, -13670).then((stops) => console.log(stops.length));


// Helper function to calculate the Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in kilometers
}

// Helper function to fiter duplicate stops and return the closest stop
async function filterClosestStopsByRoute(stops, inputLat, inputLon) {
  // Step 1: Group stops by route name
  const stopsByRoute = stops.reduce((acc, stop) => {
    stop.routes.forEach((route) => {
      if (!acc[route]) acc[route] = [];
      acc[route].push(stop);
    });
    return acc;
  }, {});

  // Step 2: For each route, calculate the closest stop (if there are duplicates)
  const closestStops = Object.values(stopsByRoute).map((stopsGroup) => {
    if (stopsGroup.length === 1) {
      // If there's only one stop for a route, return it as is
      return stopsGroup[0];
    } else {
      // If there are multiple stops for a route, find the closest one
      return stopsGroup.reduce((closestStop, stop) => {
        const distance = haversineDistance(inputLat, inputLon, stop.stop_lat, stop.stop_lon);
        return distance < closestStop.distance ? { ...stop, distance } : closestStop;
      }, { ...stopsGroup[0], distance: Infinity });
    }
  });

  return closestStops;
}

// Example Usage
(async () => {
  const addressInfo = await getCoordinates("2329 West Mall, Vancouver, BC");
  if (!addressInfo) {
    console.error("Could not retrieve address coordinates.");
    return;
  }

  const stops = await getStopsWithRoutes(addressInfo.latIndex, addressInfo.lonIndex);
  const filteredStops = await filterClosestStopsByRoute(stops, addressInfo.lat, addressInfo.lon);
  
  // console.log(filteredStops.length);

    // Log the route names from the filtered stops
    const routeNames = filteredStops.map(stop => stop.routes).flat();
    // console.log("Route Names:", routeNames);
  
    // Also log the full filteredStops array if you want to inspect it
    // console.log("Filtered Stops:", filteredStops);
})();











/////////////////////////////////////////////////////////////////////////////////////////////

// listen
app.listen(PORT, () =>
  console.log(`Server is running at ${BACKEND_URL}:${PORT}`)
);
