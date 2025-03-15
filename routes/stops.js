import express from "express";
import { getStops } from "../controllers/stopsController.js";

const stopsRouter = express.Router();

stopsRouter.get("/", getStops);

export default stopsRouter;
