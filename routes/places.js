import express from "express";
import { getPlaces } from "../controllers/placesController.js";

const router = express.Router();

router.get("/", getPlaces);

export default router;
