import "dotenv/config"; // where am i using this?
import express from "express";
import cors from "cors";
const app = express();
import routesRouter from "./routes/routes.js";
import stopsRouter from "./routes/stops.js";
import placesRouter from "./routes/places.js";

const PORT = process.env.PORT || 5050;
const BACKEND_URL = process.env.BACKEND_URL;

// middleware to parse req.body
app.use(express.json()); // do i need this? since i won't be using req.body? but i am using req.query... let's see!

// endpoints

app.get("/", (_req, res) => {
  res.send("Welcome to Convene's Backend Server");
});

app.use("/routes", routesRouter);
app.use("/stops", stopsRouter);
app.use("/places", placesRouter);

// listen
app.listen(PORT, () =>
  console.log(`Server is running at ${BACKEND_URL}:${PORT}`)
);
