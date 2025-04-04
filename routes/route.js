import express from "express";
import { getFilteredStops } from "../controllers/routeController.js";

const routeRouter = express.Router();

routeRouter.get("/", getFilteredStops);

export default routeRouter;
