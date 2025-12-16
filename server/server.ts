import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import { toNodeHandler } from "better-auth/node"
import prisma from "./lib/prisma.js"
import { auth } from "./lib/auth.js"

const app = express()
const port = 3000

// Middleware
app.use(express.json())

// CORS setup
const coreOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
}
app.use(cors(coreOptions))

// Better Auth endpoint
app.use("/api/auth", toNodeHandler(auth))

// Test route
app.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany()
    res.json({ message: "Server is Live!", users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Something went wrong" })
  }
})

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})


