import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

// Load environment variables
const app = express();
const port = 3000;

// Prisma client using new Prisma 7 adapter
const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL, // DB connection from .env
});

// CORS setup
const coreOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(coreOptions));

// Better Auth endpoint
app.use("/api/auth", toNodeHandler(auth));

// Test route
app.get("/", async (req: Request, res: Response) => {
  try {
    // Example Prisma query
    const users = await prisma.user.findMany();
    res.json({ message: "Server is Live!", users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

