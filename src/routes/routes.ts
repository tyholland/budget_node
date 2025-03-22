import { Express } from "express";
import { createUser, deleteUser } from "../controllers/user";
import {
  createBudget,
  deleteBudgetItem,
  getBudget,
  updateBudgetItem,
} from "../controllers/budget";

export const routes = (app: Express) => {
  // Create User
  app.post("/user/create", createUser);

  // Delete User
  app.post("/user/delete", deleteUser);

  // Get Budget
  app.get("/budget/:user_id", getBudget);

  // Create Budget
  app.post("/budget/create", createBudget);

  // Update Budget Item
  app.put("/budget/update", updateBudgetItem);

  // Delete Budget Item
  app.delete("/budget/remove", deleteBudgetItem);
};
