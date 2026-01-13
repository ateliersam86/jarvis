/**
 * Interface for the Modular Plugin System
 * Allows third-party integration of new capabilities, tools, and agent behaviors.
 */

export interface PluginConfig {
  [key: string]: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any; // JSON Schema
  handler: (args: any, context: any) => Promise<any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  type: 'tool' | 'memory' | 'reasoning' | 'io';
}

export interface Plugin {
  /**
   * Unique identifier for the plugin (e.g., "com.jarvis.git-integration")
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Semantic version string
   */
  version: string;

  /**
   * List of capabilities this plugin provides
   */
  capabilities: AgentCapability[];

  /**
   * Lifecycle method called when the plugin is loaded
   */
  initialize(config: PluginConfig): Promise<void>;

  /**
   * Lifecycle method called when the plugin is unloaded or system shuts down
   */
  shutdown(): Promise<void>;

  /**
   * Returns a list of tools provided by this plugin
   */
  getTools(): ToolDefinition[];

  /**
   * Optional: Hook to modify agent system instructions
   */
  extendSystemPrompt?(currentPrompt: string): string;
}

/**
 * Base class for easy Plugin implementation
 */
export abstract class BasePlugin implements Plugin {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  
  protected config: PluginConfig = {};

  async initialize(config: PluginConfig): Promise<void> {
    this.config = config;
    console.log(`Plugin ${this.name} (${this.id}) initialized.`);
  }

  async shutdown(): Promise<void> {
    console.log(`Plugin ${this.name} (${this.id}) shutting down.`);
  }

  abstract getTools(): ToolDefinition[];
  
  get capabilities(): AgentCapability[] {
    return [];
  }
}
