import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import { toNodeHandler } from "better-auth/node"
import prisma from "./lib/prisma.js"
import { auth } from "./lib/auth.js"
import userRoutes from "./routes/userRoutes.js"
import projectRouter from "./routes/projectRoutes.js"
import { stripeWebhook } from "./controllers/stripeWebhook.js"

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
}

app.use(cors(corsOptions))
app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhook)

app.use(express.json({ limit: "50mb" }))

app.use("/api/auth", toNodeHandler(auth.handler))

app.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany()
  res.json({ message: "Server is Live!", users })
})

app.use("/api/user", userRoutes)
app.use("/api/project", projectRouter)

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})

process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
