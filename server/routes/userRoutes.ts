import express, { Router } from "express";
import {
  getAllProjects,
  getProjectId,
  getUserCredits,
  toggleProjectPublic,
} from "../controllers/userController";
import { protect } from "../middlewares/auth";

const userRoutes = express.Router();

userRoutes.get("/credits", protect, getUserCredits);
userRoutes.get("/projects", protect, getAllProjects);
userRoutes.get("/projects/:projectId", protect, getProjectId);
userRoutes.patch("/projects/:projectId/publish", protect, toggleProjectPublic);

export default userRoutes;
