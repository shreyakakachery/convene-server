import express from "express";
import { getFilteredStops } from "../controllers/routeController.js";

const routeRouter = express.Router();

// Get filtered stops based on routeName and stopId
routeRouter.get("/", getFilteredStops);

export default routeRouter;
