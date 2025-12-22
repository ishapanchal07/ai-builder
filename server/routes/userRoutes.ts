import express from 'express'
import {
  createUserProject,
  getUserCredits,
  getUserProject,
  getUserProjects,
  purchaseCredits,
  togglePublish
} from '../controllers/userController'
import { protect } from '../middlewares/auth'

const userRouter = express.Router()

// Credits
userRouter.get('/credits', protect, getUserCredits)

// Projects
userRouter.post('/project', protect, createUserProject)
userRouter.get('/project/:projectId', protect, getUserProject)
userRouter.get('/projects', protect, getUserProjects)

// Publish toggle
userRouter.patch('/publish/:projectId', protect, togglePublish)

// Purchase credits
userRouter.post('/purchase-credits', protect, purchaseCredits)

export default userRouter
