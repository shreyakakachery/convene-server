import express from "express";
import { getPlaces } from "../controllers/placesController.js"; // Import controller

const router = express.Router();

router.get("/", getPlaces); // GET /places?lat=...&lon=...

export default router;
