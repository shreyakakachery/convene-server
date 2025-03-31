import "dotenv/config"; 
import express from "express";
import cors from "cors";
const app = express();
import routesRouter from "./routes/routes.js";
import routeRouter from "./routes/route.js";
import stopsRouter from "./routes/stops.js";
import placesRouter from "./routes/places.js";

const PORT = process.env.PORT || 5050;
const BACKEND_URL = process.env.BACKEND_URL;

app.use(cors({ origin: process.env.CORS_ORIGIN }));

app.get("/", (_req, res) => {
  res.send("Welcome to Convene's Backend Server");
});

app.use("/routes", routesRouter);
app.use("/route", routeRouter);
app.use("/stops", stopsRouter);
app.use("/places", placesRouter);

app.listen(PORT, () =>
  console.log(`Server is running at ${BACKEND_URL}:${PORT}`)
);
