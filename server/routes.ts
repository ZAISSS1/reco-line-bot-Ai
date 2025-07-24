import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLineGroupSchema, insertKeywordSchema, insertBroadcastSchema, insertActivitySchema } from "@shared/schema";
import { Client } from "@line/bot-sdk";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// LINE Bot configuration with latest token
function getLineClient() {
  const lineConfig = {
    channelAccessToken: 'FfuhpJwPUZkmJ9UjAqIZkaMjFnVW684qvEIWtA5a4sMtEVSdatGi34oDPBmG3VpqiSTu7hsLoohXGZB1pPgAJ6yGoIwu7SyUfEWK+P3SXN3Z1WV0Sfoh3Ng6W6P8Vb31ugveQ4e2IcPtPRxmgU2FWgdB04t89/1O/w1cDnyilFU=',
    channelSecret: process.env.CHANNEL_SECRET!
  };
  return new Client(lineConfig);
}

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件！'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering API routes...");

  // Ensure all API routes are registered before any catch-all middleware
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Test route - debug logging
  app.all("/api/test", (req, res) => {
    console.log(`Test ${req.method} route hit successfully`);
    res.json({ message: `${req.method} route working`, timestamp: new Date().toISOString() });
  });
  
  app.post("/api/test-post", (req, res) => {
    console.log("Direct POST test route hit");
    res.json({ success: true, method: "POST", body: req.body });
  });

  // LINE Webhook
  app.post("/api/webhook", async (req, res) => {
    try {
      console.log('Webhook POST endpoint hit');
      console.log('Webhook received:', JSON.stringify(req.body, null, 2));
      const events = req.body.events;
      
      if (!events || !Array.isArray(events)) {
        console.log('No events found in webhook');
        return res.status(200).json({ status: 'success' });
      }
      
      for (const event of events) {
        console.log('Processing event:', event.type, event.source?.type);
        if (event.type === 'message' && event.message.type === 'text') {
          const groupId = event.source?.groupId;
          const messageText = event.message.text;
          
          console.log(`Message received - Group: ${groupId}, Text: "${messageText}"`);
          
          if (groupId) {
            // Check if group exists, if not create it
            let group = await storage.getGroup(groupId);
            if (!group) {
              // Try to get group name from LINE API
              let groupName = `群組 ${groupId.slice(-8)}`;
              try {
                const lineClient = getLineClient();
                const groupSummary = await lineClient.getGroupSummary(groupId);
                groupName = groupSummary.groupName || groupName;
              } catch (error) {
                console.warn('Failed to get group name:', error);
              }
              
              group = await storage.createGroup({
                groupId,
                name: groupName,
                isActive: true
              });
            }

            // Find matching keyword
            const keyword = await storage.findKeywordByText(groupId, messageText);
            console.log(`Keyword search result for "${messageText}":`, keyword ? `Found: ${keyword.keyword}` : 'Not found');
            
            if (keyword) {
              const messages: any[] = [];
              
              // Add text message
              if (keyword.responseText) {
                messages.push({
                  type: 'text',
                  text: keyword.responseText
                });
              }
              
              // Add image messages
              if (keyword.images && keyword.images.length > 0) {
                for (const imageUrl of keyword.images) {
                  const fullImageUrl = imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `https://reco-line-bot-ai.replit.app${imageUrl}`;
                  messages.push({
                    type: 'image',
                    originalContentUrl: fullImageUrl,
                    previewImageUrl: fullImageUrl
                  });
                }
              }

              if (messages.length > 0) {
                console.log(`Sending ${messages.length} messages to LINE API...`);
                try {
                  const lineClient = getLineClient();
                  await lineClient.replyMessage(event.replyToken, messages);
                  console.log('Successfully sent reply to LINE');
                  
                  // Log activity
                  await storage.createActivity({
                    type: 'auto_reply',
                    groupId,
                    message: `自動回覆 "${messageText}" 於群組 ${group.name}`,
                    timestamp: new Date().toISOString()
                  });
                } catch (replyError) {
                  console.error('Failed to send reply:', replyError);
                }
              } else {
                console.log('No messages to send (empty response)');
              }
            }
          }
        }
      }
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all groups
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Create group
  app.post("/api/groups", async (req, res) => {
    try {
      const groupData = insertLineGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  // Update group
  app.patch("/api/groups/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const updates = req.body;
      const group = await storage.updateGroup(groupId, updates);
      
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  // Sync group names from LINE API
  app.post("/api/groups/sync-names", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      const updatedGroups = [];
      
      for (const group of groups) {
        try {
          const lineClient = getLineClient();
          const groupSummary = await lineClient.getGroupSummary(group.groupId);
          if (groupSummary.groupName && groupSummary.groupName !== group.name) {
            console.log(`Updating group ${group.groupId} name from "${group.name}" to "${groupSummary.groupName}"`);
            const updatedGroup = await storage.updateGroup(group.groupId, { 
              name: groupSummary.groupName 
            });
            if (updatedGroup) {
              updatedGroups.push(updatedGroup);
            }
          }
        } catch (error) {
          console.warn(`Failed to sync name for group ${group.groupId}:`, error);
        }
      }
      
      res.json({ 
        message: `同步了 ${updatedGroups.length} 個群組名稱`,
        updatedGroups 
      });
    } catch (error) {
      console.error('Failed to sync group names:', error);
      res.status(500).json({ error: "Failed to sync group names" });
    }
  });

  // Get keywords for a group
  app.get("/api/groups/:groupId/keywords", async (req, res) => {
    try {
      const { groupId } = req.params;
      const keywords = await storage.getKeywords(groupId);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });

  // Get all keywords
  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });

  // Create keyword
  app.post("/api/keywords", async (req, res) => {
    try {
      const keywordData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(keywordData);
      
      // Log activity
      await storage.createActivity({
        type: 'keyword_update',
        groupId: keyword.groupId,
        message: `新增關鍵字 "${keyword.keyword}"`,
        timestamp: new Date().toISOString()
      });
      
      res.json(keyword);
    } catch (error) {
      res.status(400).json({ error: "Invalid keyword data" });
    }
  });

  // Update keyword
  app.patch("/api/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const keyword = await storage.updateKeyword(id, updates);
      
      if (!keyword) {
        return res.status(404).json({ error: "Keyword not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: 'keyword_update',
        groupId: keyword.groupId,
        message: `更新關鍵字 "${keyword.keyword}"`,
        timestamp: new Date().toISOString()
      });
      
      res.json(keyword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update keyword" });
    }
  });

  // Delete keyword
  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteKeyword(id);
      
      if (!success) {
        return res.status(404).json({ error: "Keyword not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete keyword" });
    }
  });

  // Upload image
  app.post("/api/upload", upload.single('image'), (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Serve uploaded images
  app.use('/uploads', (await import('express')).static(path.join(process.cwd(), 'uploads')));

  // Send broadcast (legacy support)
  app.post("/api/broadcast", async (req, res) => {
    try {
      // Add sentAt timestamp to the request body
      const requestBody = {
        ...req.body,
        sentAt: new Date().toISOString()
      };
      const broadcastData = insertBroadcastSchema.parse(requestBody);
      
      const messages: any[] = [];
      
      // Add text message
      if (broadcastData.message) {
        messages.push({
          type: 'text',
          text: broadcastData.message
        });
      }
      
      // Add image messages
      if (broadcastData.images && broadcastData.images.length > 0) {
        for (const imageUrl of broadcastData.images) {
          const fullImageUrl = imageUrl.startsWith('http') 
            ? imageUrl 
            : `https://reco-line-bot-ai.replit.app${imageUrl}`;
          messages.push({
            type: 'image',
            originalContentUrl: fullImageUrl,
            previewImageUrl: fullImageUrl
          });
        }
      }

      // Send to each target group
      let sentCount = 0;
      for (const groupId of broadcastData.targetGroups) {
        try {
          console.log(`Sending broadcast to group ${groupId}...`);
          const lineClient = getLineClient();
          await lineClient.pushMessage(groupId, messages);
          console.log(`Successfully sent to group ${groupId}`);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send to group ${groupId}:`, error);
        }
      }
      console.log(`Broadcast sent to ${sentCount}/${broadcastData.targetGroups.length} groups`);
      
      // Save broadcast record
      const broadcast = await storage.createBroadcast({
        ...broadcastData,
        sentAt: new Date().toISOString()
      });
      
      // Log activity
      await storage.createActivity({
        type: 'broadcast',
        message: `推播訊息至 ${broadcastData.targetGroups.length} 個群組`,
        timestamp: new Date().toISOString()
      });
      
      res.json(broadcast);
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ error: "Failed to send broadcast" });
    }
  });

  // Send multiple broadcasts (individual group messages)
  app.post("/api/broadcast-multiple", async (req, res) => {
    try {
      const { broadcasts, testMode = false } = req.body;
      
      if (!broadcasts || !Array.isArray(broadcasts)) {
        return res.status(400).json({ error: "Invalid broadcasts data" });
      }

      console.log(`Starting individual broadcasts to ${broadcasts.length} groups (Test Mode: ${testMode})`);
      const results = [];
      let successCount = 0;
      
      // Test mode: simulate successful sending without actual API calls
      if (testMode) {
        console.log("Running in test mode - simulating successful broadcasts");
        for (const broadcast of broadcasts) {
          if (broadcast.groupId && broadcast.message.trim()) {
            await storage.createBroadcast({
              message: broadcast.message,
              images: broadcast.images || [],
              targetGroups: [broadcast.groupId],
              sentAt: new Date().toISOString()
            });
            
            await storage.createActivity({
              type: 'broadcast',
              groupId: broadcast.groupId,
              message: `[測試模式] 推播訊息至群組 "${broadcast.groupName}"`,
              timestamp: new Date().toISOString()
            });
            
            results.push({
              groupId: broadcast.groupId,
              groupName: broadcast.groupName,
              success: true,
              testMode: true
            });
            successCount++;
          }
        }
        
        return res.json({
          success: true,
          totalSent: successCount,
          results,
          testMode: true,
          message: "測試模式：所有推播已模擬成功發送並記錄"
        });
      }

      // Send to each group individually with delay to avoid rate limiting
      for (const broadcast of broadcasts) {
        if (!broadcast.groupId || !broadcast.message) {
          continue;
        }

        try {
          const messages: any[] = [];
          
          // Add text message
          messages.push({
            type: 'text',
            text: broadcast.message
          });
          
          // Add image messages
          if (broadcast.images && broadcast.images.length > 0) {
            for (const imageUrl of broadcast.images) {
              const fullImageUrl = imageUrl.startsWith('http') 
                ? imageUrl 
                : `https://reco-line-bot-ai.replit.app${imageUrl}`;
              messages.push({
                type: 'image',
                originalContentUrl: fullImageUrl,
                previewImageUrl: fullImageUrl
              });
            }
          }

          console.log(`Sending individual broadcast to group ${broadcast.groupId}...`);
          const lineClient = getLineClient();
          await lineClient.pushMessage(broadcast.groupId, messages);
          console.log(`Successfully sent individual broadcast to group ${broadcast.groupId}`);
          
          // Save broadcast record for each individual broadcast
          const savedBroadcast = await storage.createBroadcast({
            message: broadcast.message,
            images: broadcast.images || [],
            targetGroups: [broadcast.groupId],
            sentAt: new Date().toISOString()
          });
          
          // Log individual activity for each successful broadcast
          await storage.createActivity({
            type: 'broadcast',
            groupId: broadcast.groupId,
            message: `推播訊息至群組 "${broadcast.groupName}"`,
            timestamp: new Date().toISOString()
          });
          
          results.push({
            groupId: broadcast.groupId,
            groupName: broadcast.groupName,
            success: true,
            broadcast: savedBroadcast
          });
          
          successCount++;
          
          // Add delay to prevent rate limiting (only if more broadcasts to send)
          if (broadcasts.indexOf(broadcast) < broadcasts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay (increased from 500ms)
          }
        } catch (error) {
          console.error(`Failed to send to group ${broadcast.groupId}:`, error);
          
          // Extract more detailed error information
          let errorMessage = (error as Error).message;
          if ((error as any).response?.data) {
            console.error('LINE API Error Details:', (error as any).response.data);
            errorMessage = `LINE API Error: ${JSON.stringify((error as any).response.data)}`;
          }
          if ((error as any).statusCode) {
            const statusCode = (error as any).statusCode;
            if (statusCode === 429) {
              errorMessage = "LINE API 暫時限制中，請稍後再試";
            } else if (statusCode === 400) {
              errorMessage = "請確認 Bot 已加入此群組";
            } else if (statusCode === 401) {
              errorMessage = "認證失敗，請檢查設定";
            } else {
              errorMessage = `HTTP ${statusCode} 錯誤`;
            }
          }
          
          // Still save the broadcast attempt for records
          try {
            await storage.createBroadcast({
              message: broadcast.message,
              images: broadcast.images || [],
              targetGroups: [broadcast.groupId],
              sentAt: new Date().toISOString()
            });
          } catch (saveError) {
            console.error('Failed to save broadcast record:', saveError);
          }
          
          results.push({
            groupId: broadcast.groupId,
            groupName: broadcast.groupName,
            success: false,
            error: errorMessage
          });
        }
      }
      
      // Log summary activity only if there were any successful broadcasts
      if (successCount > 0) {
        await storage.createActivity({
          type: 'broadcast',
          message: `個別推播完成：成功 ${successCount} 個，失敗 ${broadcasts.length - successCount} 個群組`,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        totalSent: successCount,
        results
      });
    } catch (error) {
      console.error('Multiple broadcast error:', error);
      res.status(500).json({ error: "Failed to send broadcasts" });
    }
  });

  // Get activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Test endpoint for debugging
  app.post("/api/test-webhook", async (req, res) => {
    try {
      const testEvent = {
        events: [{
          type: 'message',
          replyToken: 'test-reply-token',
          source: {
            type: 'group',
            groupId: 'C6fac4e225f0f9dfabc9568be5acc14b8'
          },
          message: {
            type: 'text',
            text: '123'
          }
        }]
      };
      
      // Simulate webhook processing
      const response = await fetch('https://reco-line-bot-ai.replit.app/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEvent)
      });
      
      const result = await response.text();
      res.json({ status: 'test completed', response: result });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: 'Test failed' });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      const keywords = await storage.getAllKeywords();
      const activities = await storage.getRecentActivities(1000);
      
      const activeGroups = groups.filter(g => g.isActive).length;
      const totalKeywords = keywords.length;
      const todayReplies = activities.filter(a => 
        a.type === 'auto_reply' && 
        new Date(a.timestamp).toDateString() === new Date().toDateString()
      ).length;
      const broadcasts = activities.filter(a => a.type === 'broadcast').length;
      
      res.json({
        activeGroups,
        maxGroups: 20,
        totalKeywords,
        todayReplies,
        broadcasts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  console.log("All API routes registered successfully");
  
  const httpServer = createServer(app);
  return httpServer;
}
