import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import { toNodeHandler } from "better-auth/node"
import prisma from "./lib/prisma.js"
import { auth } from "./lib/auth.js"
import userRouter from "./routes/userRoutes.js"
import projectRouter from "./routes/projectRoutes.js"

const app = express()
const port = 3000

const corsOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: "50mb" }))

// ✅ FIXED Better Auth route
app.use("/api/auth", toNodeHandler(auth.handler))

// Test route
app.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany()
  res.json({ message: "Server is Live!", users })
})

// Custom routes
app.use("/api/users", userRouter)
app.use("/api/project", projectRouter)

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
