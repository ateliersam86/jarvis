import { redis } from '../redis';

export interface AgentState {
  status: 'idle' | 'working' | 'offline' | 'error';
  currentTask?: string;
  lastActive: number;
  metadata?: Record<string, any>;
}

export class SharedMemory {
  private static instance: SharedMemory;
  private readonly AGENT_PREFIX = 'agent:state:';
  private readonly PROJECT_PREFIX = 'project:context:';
  private readonly PRESENCE_SET = 'agents:online';

  private constructor() {}

  public static getInstance(): SharedMemory {
    if (!SharedMemory.instance) {
      SharedMemory.instance = new SharedMemory();
    }
    return SharedMemory.instance;
  }

  /**
   * Update an agent's real-time state
   */
  async setAgentState(agentId: string, state: AgentState): Promise<void> {
    const key = `${this.AGENT_PREFIX}${agentId}`;
    await redis.hset(key, {
      ...state,
      metadata: JSON.stringify(state.metadata || {}),
      lastActive: Date.now()
    });
    
    // Refresh presence
    await redis.zadd(this.PRESENCE_SET, Date.now(), agentId);
    // Set expiry for state (e.g., 1 hour) to auto-cleanup
    await redis.expire(key, 3600);
  }

  /**
   * Get an agent's current state
   */
  async getAgentState(agentId: string): Promise<AgentState | null> {
    const key = `${this.AGENT_PREFIX}${agentId}`;
    const data = await redis.hgetall(key);
    
    if (!data || Object.keys(data).length === 0) return null;

    return {
      status: data.status as AgentState['status'],
      currentTask: data.currentTask,
      lastActive: parseInt(data.lastActive),
      metadata: data.metadata ? JSON.parse(data.metadata) : {}
    };
  }

  /**
   * Get all online agents (active in last 5 minutes)
   */
  async getOnlineAgents(): Promise<string[]> {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    // Remove stale agents
    await redis.zremrangebyscore(this.PRESENCE_SET, '-inf', fiveMinutesAgo);
    // Get remaining
    return await redis.zrange(this.PRESENCE_SET, 0, -1);
  }

  /**
   * Store high-speed project context (e.g., current file focus, recent diffs)
   */
  async setProjectContext(projectId: string, context: Record<string, any>): Promise<void> {
    const key = `${this.PROJECT_PREFIX}${projectId}`;
    // Use JSON string for simplicity, can be optimized to Hash if partial updates needed
    await redis.set(key, JSON.stringify(context));
  }

  /**
   * Retrieve project context
   */
  async getProjectContext(projectId: string): Promise<Record<string, any> | null> {
    const key = `${this.PROJECT_PREFIX}${projectId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Pub/Sub for immediate events
   */
  async publishEvent(channel: string, event: any): Promise<number> {
    return await redis.publish(channel, JSON.stringify(event));
  }
}

export const sharedMemory = SharedMemory.getInstance();
