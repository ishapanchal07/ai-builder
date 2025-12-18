import express from 'express';
import { createUserProject, getUserCreadits, getUserProject, getUserProjects, purchaseCredits, TogglePublish } from '../controlls/userController.js';
import { protect } from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.get('/credits',protect, getUserCreadits)
userRouter.post('/project',protect, createUserProject)
userRouter.get('/project.:projectId',protect, getUserProject)
userRouter.get('/project',protect, getUserProjects)
userRouter.get('/publish-toggle/:projectId',protect, TogglePublish)
userRouter.post('/purchase-creadits',protect, purchaseCredits)



export default userRouter;
