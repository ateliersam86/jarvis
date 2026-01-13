import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SharedMemory } from './redis-store';
import { redis } from '../redis';

// Mock the redis module
vi.mock('../redis', () => ({
  redis: {
    hset: vi.fn(),
    hgetall: vi.fn(),
    zadd: vi.fn(),
    expire: vi.fn(),
    zremrangebyscore: vi.fn(),
    zrange: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    publish: vi.fn(),
    on: vi.fn(),
  }
}));

describe('SharedMemory', () => {
  let sharedMemory: SharedMemory;

  beforeEach(() => {
    vi.clearAllMocks();
    sharedMemory = SharedMemory.getInstance();
  });

  it('should set agent state correctly', async () => {
    const agentId = 'agent-123';
    const state = {
      status: 'working' as const,
      currentTask: 'analyzing-code',
      lastActive: 1000,
      metadata: { workload: 'high' }
    };

    await sharedMemory.setAgentState(agentId, state);

    expect(redis.hset).toHaveBeenCalledWith(
      `agent:state:${agentId}`,
      expect.objectContaining({
        status: 'working',
        currentTask: 'analyzing-code'
      })
    );
    expect(redis.expire).toHaveBeenCalledWith(`agent:state:${agentId}`, 3600);
  });

  it('should get agent state correctly', async () => {
    const agentId = 'agent-123';
    // Cast to any or mocked function type to access mock implementations
    (redis.hgetall as any).mockResolvedValue({
      status: 'idle',
      lastActive: '1234567890',
      metadata: '{"cpu": 20}'
    });

    const result = await sharedMemory.getAgentState(agentId);

    expect(result).toEqual({
      status: 'idle',
      lastActive: 1234567890,
      currentTask: undefined,
      metadata: { cpu: 20 }
    });
  });

  it('should return null for non-existent agent state', async () => {
    (redis.hgetall as any).mockResolvedValue({});
    const result = await sharedMemory.getAgentState('unknown');
    expect(result).toBeNull();
  });

  it('should store project context', async () => {
    const projectId = 'proj-1';
    const context = { files: ['a.ts', 'b.ts'] };
    
    await sharedMemory.setProjectContext(projectId, context);
    
    expect(redis.set).toHaveBeenCalledWith(
      `project:context:${projectId}`,
      JSON.stringify(context)
    );
  });
});
