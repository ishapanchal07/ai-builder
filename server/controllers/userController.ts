import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import openai from '../config/openai'
import Stripe from 'stripe'

// ==============================
// Get User Credits
// ==============================
export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        res.json({ credits: user?.credits ?? 0 })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// ==============================
// Create User Project
// ==============================
export const createUserProject = async (req: Request, res: Response) => {
    const userId = req.userId

    try {
        const { initial_prompt } = req.body

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'Add credits to create more projects' })
        }

        const project = await prisma.websiteProject.create({
            data: {
                name:
                    initial_prompt.length > 50
                        ? initial_prompt.substring(0, 47) + '...'
                        : initial_prompt,
                initial_prompt,
                userId
            }
        })

        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 } }
        })

        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id
            }
        })

        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        })

        res.json({ projectId: project.id })

        // Prompt enhancement
        const promptEnhanceResponse = await openai.chat.completions.create({
            model: 'kwaipilot/kat-coder-pro:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a prompt enhancement specialist. Enhance the user's website request into a detailed, modern, responsive website prompt.`
                },
                {
                    role: 'user',
                    content: initial_prompt
                }
            ]
        })

        const enhancedPrompt =
            promptEnhanceResponse.choices[0].message.content ?? initial_prompt

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Now generating your website...',
                projectId: project.id
            }
        })

        const codeGenerationResponse = await openai.chat.completions.create({
            model: 'kwaipilot/kat-coder-pro:free',
            messages: [
                {
                    role: 'system',
                    content: `Generate a complete single-page website in pure HTML using Tailwind CSS.`
                },
                {
                    role: 'user',
                    content: enhancedPrompt
                }
            ]
        })

        const code = codeGenerationResponse.choices[0].message.content ?? ''

        if (!code) {
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            })
            return
        }

        const cleanCode = code
            .replace(/```[a-z]*\n?/gi, '')
            .replace(/```$/g, '')
            .trim()

        const version = await prisma.version.create({
            data: {
                code: cleanCode,
                description: 'Initial version',
                projectId: project.id
            }
        })

        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: cleanCode,
                current_version_index: version.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can now preview it.",
                projectId: project.id
            }
        })
    } catch (error: any) {
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            })
        }

        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// ==============================
// Get Single Project
// ==============================
export const getUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { projectId } = req.params

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: {
                conversation: { orderBy: { timestamp: 'asc' } },
                versions: { orderBy: { timestamp: 'asc' } }
            }
        })

        res.json({ project })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// ==============================
// Get All Projects
// ==============================
export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const projects = await prisma.websiteProject.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        })

        res.json({ projects })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// ==============================
// Toggle Publish
// ==============================
export const togglePublish = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { projectId } = req.params

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { isPublished: !project.isPublished }
        })

        res.json({
            message: project.isPublished
                ? 'Project unpublished'
                : 'Project published successfully'
        })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// ==============================
// Purchase Credits
// ==============================
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        interface Plan {
            credits: number
            amount: number
        }

        const plans: Record<string, Plan> = {
            basic: { credits: 100, amount: 5 },
            pro: { credits: 400, amount: 19 },
            enterprise: { credits: 1000, amount: 49 }
        }

        const userId = req.userId
        const { planId } = req.body as { planId: keyof typeof plans }
        const origin = req.headers.origin as string

        const plan = plans[planId]
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' })
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: userId!,
                planId,
                amount: plan.amount,
                credits: plan.credits
            }
        })

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/loading`,
            cancel_url: origin,
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `AiSiteBuilder - ${plan.credits} credits`
                        },
                        unit_amount: plan.amount * 100
                    },
                    quantity: 1
                }
            ],
            metadata: {
                transactionId: transaction.id,
                appId: 'ai-site-builder'
            }
        })

        res.json({ payment_link: session.url })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}
