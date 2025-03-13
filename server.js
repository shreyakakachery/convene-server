import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();
import initKnex from "knex";
import configuration from "./knexfile.js";
const knex = initKnex(configuration);
import placesRouter from "./routes/places.js"; // Import the places router

const PORT = process.env.PORT || 5050;
const BACKEND_URL = process.env.BACKEND_URL;

// middleware to parse req.body
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Welcome to the Convene's Backend Server");
});

// get an array of stops!
app.get("/routes", async (_req, res) => {
  try {
    const data = await knex.select("*").from("routes").limit(2);
    res.json(data);
  } catch {
    res.status(500).send("Error getting routes");
  }
});

app.get("/stops", async (_req, res) => {
  try {
    const data = await knex.select("*").from("stops").limit(2);
    res.json(data);
  } catch {
    res.status(500).send("Error getting stops");
  }
});


app.use("/places", placesRouter);

// listen
app.listen(PORT, () =>
  console.log(`Server is running at ${BACKEND_URL}:${PORT}`)
);
