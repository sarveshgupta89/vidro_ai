import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();                          // load .env
dotenv.config({ path: '.env.local', override: true }); // .env.local takes precedence

// Initialize Firebase Admin
// We need to use a service account or application default credentials.
// For this environment, we'll mock the admin SDK if credentials aren't provided,
// or use a placeholder initialization.
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to initialize Firebase Admin", e);
    initializeApp({
      projectId: "demo-project"
    });
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Firebase Admin not initialized properly.");
  // Initialize with dummy config to prevent crashing, but it won't work for real DB calls
  initializeApp({
    projectId: "demo-project"
  });
}

const db = getFirestore();

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook needs raw body
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      
      try {
        // Find user by stripe_customer_id
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('stripe_customer_id', '==', customerId).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const creditsToAdd = session.metadata?.credits ? parseInt(session.metadata.credits) : 0;
          
          await userDoc.ref.update({
            credits_balance: FieldValue.increment(creditsToAdd)
          });
          
          // Log transaction
          await db.collection('transactions').add({
            userId: userDoc.id,
            amount_paid: session.amount_total,
            credits_added: creditsToAdd,
            stripe_session_id: session.id,
            created_at: FieldValue.serverTimestamp()
          });
          
          console.log(`Added ${creditsToAdd} credits to user ${userDoc.id}`);
        }
      } catch (error) {
        console.error('Error fulfilling order:', error);
      }
    }

    res.json({ received: true });
  });

  // Regular middleware for other routes
  app.use(express.json());

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    try {
      const { tier, userId, customerId, email } = req.body;
      let priceId = '';
      let credits = 0;

      if (tier === 'starter') {
        priceId = process.env.STRIPE_PRICE_STARTER || ''; // e.g., $10
        credits = 500;
      } else if (tier === 'pro') {
        priceId = process.env.STRIPE_PRICE_PRO || ''; // e.g., $25
        credits = 1500;
      }

      if (!priceId) {
        return res.status(400).json({ error: 'Invalid tier or price not configured' });
      }

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?success=true`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`,
        metadata: {
          userId,
          credits: credits.toString()
        }
      };

      if (customerId) {
        sessionConfig.customer = customerId;
      } else if (email) {
        sessionConfig.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-portal-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    try {
      const { customerId } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: 'No Stripe customer ID found. Please make a purchase first.' });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing`,
      });
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/trigger-image-generation', async (req, res) => {
    try {
      const { userId, projectId, prompt } = req.body;
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      if ((userData?.credits_balance || 0) < 7) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }
      
      // Deduct credits
      await userRef.update({
        credits_balance: FieldValue.increment(-7)
      });
      
      // Mock AI GPU Call
      // In a real app, this would call RunPod/ComfyUI
      setTimeout(async () => {
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.update({
          status: 'images_generated',
          images: [
            'https://picsum.photos/seed/ai1/800/600',
            'https://picsum.photos/seed/ai2/800/600',
            'https://picsum.photos/seed/ai3/800/600',
            'https://picsum.photos/seed/ai4/800/600',
            'https://picsum.photos/seed/ai5/800/600',
            'https://picsum.photos/seed/ai6/800/600',
            'https://picsum.photos/seed/ai7/800/600',
          ]
        });
      }, 3000);
      
      res.json({ success: true, message: 'Generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/trigger-video-generation', async (req, res) => {
    try {
      const { userId, projectId, images } = req.body;
      
      // Mock Video Generation Call
      setTimeout(async () => {
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.update({
          status: 'video_generated',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        });
      }, 5000);
      
      res.json({ success: true, message: 'Video generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/trigger-5sec-generation', async (req, res) => {
    try {
      const { userId, projectId, imageUrl, templateId, templateConfig } = req.body;

      // templateConfig contains the 3-layer template definition:
      // templateConfig.prompt  — AI prompt layer (systemPrompt, userPromptTemplate, styleModifiers)
      // templateConfig.editing — Editing layer (clips, transitions, aspectRatios)
      // templateConfig.marketing — Marketing layer (hook, cta, bestFor tags)
      // TODO: pass templateConfig.prompt to AI API (Kling/Veo) and templateConfig.editing to Shotstack/Creatomate
      if (templateConfig) {
        console.log(`[5s-gen] Template config received for templateId=${templateId}:`, JSON.stringify(templateConfig, null, 2));
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      if ((userData?.credits_balance || 0) < 5) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }
      
      // Deduct exactly 5 credits
      await userRef.update({
        credits_balance: FieldValue.increment(-5)
      });
      
      // Mock 5-second Image-to-Video Generation Call
      setTimeout(async () => {
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.update({
          status: 'video_generated',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' // Mock video URL
        });
      }, 5000); // 5 seconds mock delay
      
      res.json({ success: true, message: '5-second video generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Long Form Video Creator Endpoints ---

  app.post('/api/scrape-product', async (req, res) => {
    try {
      const { url } = req.body;
      // Mock scraping delay
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            title: "Premium Wireless Noise-Cancelling Headphones",
            description: "Experience pure sound with our industry-leading noise cancellation technology. Features 30-hour battery life and ultra-comfortable ear cushions.",
            features: ["Active Noise Cancellation", "30-hour battery", "Bluetooth 5.2", "Touch controls"],
            images: [
              "https://picsum.photos/seed/prod1/800/800",
              "https://picsum.photos/seed/prod2/800/800"
            ]
          }
        });
      }, 2000);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-images', async (req, res) => {
    try {
      const { projectId, settings } = req.body;
      
      // Update project status
      const projectRef = db.collection('projects').doc(projectId);
      await projectRef.update({ status: 'generating_images' });
      
      // Mock 7 parallel image generation jobs
      setTimeout(async () => {
        const generatedImages = Array.from({ length: 7 }).map((_, i) => ({
          id: `img_${i}`,
          url: `https://picsum.photos/seed/${projectId}_${i}/800/1200`,
          status: 'approved' // default to approved
        }));
        
        await projectRef.update({
          status: 'awaiting_image_review',
          generated_images_json: generatedImages
        });
      }, 4000);
      
      res.json({ success: true, message: 'Image generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/regenerate-image', async (req, res) => {
    try {
      const { projectId, imageId } = req.body;
      
      setTimeout(async () => {
        const projectRef = db.collection('projects').doc(projectId);
        const doc = await projectRef.get();
        const data = doc.data();
        
        if (data && data.generated_images_json) {
          const updatedImages = data.generated_images_json.map((img: any) => 
            img.id === imageId 
              ? { ...img, url: `https://picsum.photos/seed/${Date.now()}/800/1200` }
              : img
          );
          await projectRef.update({ generated_images_json: updatedImages });
        }
      }, 2000);
      
      res.json({ success: true, message: 'Image regeneration started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-videos', async (req, res) => {
    try {
      const { projectId, approvedImages } = req.body;
      
      const projectRef = db.collection('projects').doc(projectId);
      await projectRef.update({ status: 'generating_videos' });
      
      // Mock 6 video clip generation jobs
      setTimeout(async () => {
        const generatedClips = Array.from({ length: 6 }).map((_, i) => ({
          id: `clip_${i}`,
          url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Mock video
          status: 'approved'
        }));
        
        await projectRef.update({
          status: 'awaiting_video_review',
          generated_clips_json: generatedClips
        });
      }, 5000);
      
      res.json({ success: true, message: 'Video generation started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/regenerate-video', async (req, res) => {
    try {
      const { projectId, clipId } = req.body;
      
      setTimeout(async () => {
        const projectRef = db.collection('projects').doc(projectId);
        const doc = await projectRef.get();
        const data = doc.data();
        
        if (data && data.generated_clips_json) {
          const updatedClips = data.generated_clips_json.map((clip: any) => 
            clip.id === clipId 
              ? { ...clip, url: 'https://www.w3schools.com/html/mov_bbb.mp4?v=' + Date.now() }
              : clip
          );
          await projectRef.update({ generated_clips_json: updatedClips });
        }
      }, 3000);
      
      res.json({ success: true, message: 'Video regeneration started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-final', async (req, res) => {
    try {
      const { projectId } = req.body;
      
      const projectRef = db.collection('projects').doc(projectId);
      await projectRef.update({ status: 'generating_final' });
      
      // Mock final assembly (stitching, audio, captions)
      setTimeout(async () => {
        await projectRef.update({
          status: 'completed',
          final_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
        });
      }, 6000);
      
      res.json({ success: true, message: 'Final assembly started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
