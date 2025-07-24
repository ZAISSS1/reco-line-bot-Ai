import { lineGroups, keywords, broadcasts, activities, type LineGroup, type InsertLineGroup, type Keyword, type InsertKeyword, type Broadcast, type InsertBroadcast, type Activity, type InsertActivity } from "@shared/schema";

export interface IStorage {
  // Line Groups
  getGroups(): Promise<LineGroup[]>;
  getGroup(groupId: string): Promise<LineGroup | undefined>;
  createGroup(group: InsertLineGroup): Promise<LineGroup>;
  updateGroup(groupId: string, updates: Partial<LineGroup>): Promise<LineGroup | undefined>;

  // Keywords
  getKeywords(groupId: string): Promise<Keyword[]>;
  getAllKeywords(): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: number, updates: Partial<Keyword>): Promise<Keyword | undefined>;
  deleteKeyword(id: number): Promise<boolean>;
  findKeywordByText(groupId: string, keywordText: string): Promise<Keyword | undefined>;

  // Broadcasts
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  getBroadcasts(): Promise<Broadcast[]>;

  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
}

export class MemStorage implements IStorage {
  private groups: Map<string, LineGroup>;
  private keywordsList: Map<number, Keyword>;
  private broadcastsList: Map<number, Broadcast>;
  private activitiesList: Map<number, Activity>;
  private currentGroupId: number;
  private currentKeywordId: number;
  private currentBroadcastId: number;
  private currentActivityId: number;

  constructor() {
    this.groups = new Map();
    this.keywordsList = new Map();
    this.broadcastsList = new Map();
    this.activitiesList = new Map();
    this.currentGroupId = 1;
    this.currentKeywordId = 1;
    this.currentBroadcastId = 1;
    this.currentActivityId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Initialize with empty data - no demo content
  }

  async getGroups(): Promise<LineGroup[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(groupId: string): Promise<LineGroup | undefined> {
    return this.groups.get(groupId);
  }

  async createGroup(insertGroup: InsertLineGroup): Promise<LineGroup> {
    const id = this.currentGroupId++;
    const group: LineGroup = { 
      ...insertGroup, 
      id,
      isActive: insertGroup.isActive ?? true
    };
    this.groups.set(group.groupId, group);
    return group;
  }

  async updateGroup(groupId: string, updates: Partial<LineGroup>): Promise<LineGroup | undefined> {
    const group = this.groups.get(groupId);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...updates };
    this.groups.set(groupId, updatedGroup);
    return updatedGroup;
  }

  async getKeywords(groupId: string): Promise<Keyword[]> {
    return Array.from(this.keywordsList.values()).filter(k => k.groupId === groupId);
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywordsList.values());
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const id = this.currentKeywordId++;
    const keyword: Keyword = { 
      ...insertKeyword, 
      id,
      images: insertKeyword.images ? [...insertKeyword.images] : []
    };
    this.keywordsList.set(id, keyword);
    return keyword;
  }

  async updateKeyword(id: number, updates: Partial<Keyword>): Promise<Keyword | undefined> {
    const keyword = this.keywordsList.get(id);
    if (!keyword) return undefined;
    
    const updatedKeyword = { ...keyword, ...updates };
    this.keywordsList.set(id, updatedKeyword);
    return updatedKeyword;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    return this.keywordsList.delete(id);
  }

  async findKeywordByText(groupId: string, messageText: string): Promise<Keyword | undefined> {
    const groupKeywords = Array.from(this.keywordsList.values()).filter(k => k.groupId === groupId);
    
    // First try exact match
    let match = groupKeywords.find(k => k.keyword === messageText);
    if (match) return match;
    
    // Then try case-insensitive exact match
    match = groupKeywords.find(k => k.keyword.toLowerCase() === messageText.toLowerCase());
    if (match) return match;
    
    // Finally try partial match (keyword contains message or message contains keyword)
    match = groupKeywords.find(k => 
      k.keyword.toLowerCase().includes(messageText.toLowerCase()) ||
      messageText.toLowerCase().includes(k.keyword.toLowerCase())
    );
    
    return match;
  }

  async createBroadcast(insertBroadcast: InsertBroadcast): Promise<Broadcast> {
    const id = this.currentBroadcastId++;
    const broadcast: Broadcast = { 
      ...insertBroadcast, 
      id,
      images: insertBroadcast.images ? [...insertBroadcast.images] : [],
      targetGroups: insertBroadcast.targetGroups ? [...insertBroadcast.targetGroups] : []
    };
    this.broadcastsList.set(id, broadcast);
    return broadcast;
  }

  async getBroadcasts(): Promise<Broadcast[]> {
    return Array.from(this.broadcastsList.values());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      groupId: insertActivity.groupId || null
    };
    this.activitiesList.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activitiesList.values());
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
