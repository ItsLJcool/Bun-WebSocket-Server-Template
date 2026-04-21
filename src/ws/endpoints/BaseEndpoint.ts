import Server, { type WebClientData } from "../Server";
import { Glob, type BunRequest } from "bun";

// export type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export type EndpointCollection = Record<string, BaseEndpoint>;

export default abstract class BaseEndpoint {
	/** The collection of all endpoints registered. */
	public static registry = new Map<string, BaseEndpoint>();

	/**
	 * Attempts to register a new endpoint as a singleton into the registry.
	 * If the endpoint is already registered, it will not register.
	 * @param this The class (itself commonly) to register.
	 * @returns boolean
	 */
	protected static register<T extends BaseEndpoint>(this: new () => T):boolean {
		const instance = new this();
		if (BaseEndpoint.registry.has(instance.name)) {
			console.error(`Attempted to register an endpoint with the name "${instance.name}", but one already exists. Will not register.`);
			return false;
		}
		BaseEndpoint.registry.set(instance.name, instance);
		return true;
	}

	/**
	 * Gets an endpoint singleton by name.
	 * @param name 
	 * @returns BaseEndpoint or undefined
	 */
	static get(name: string):BaseEndpoint | undefined { return this.registry.get(name); }

	/** The name of the endpoint, used for WebSockets to directly talk to this specific endpoint. */
	abstract name: string;

	/** Quick access to the server instance */
	public get server() { return Server.get(); }
	/** Quick access to all the connected clients in the server, locally */
	public get clients() { return Server.clients; }

	/**
	 * When a client connects to the Server.
	 * @param client 
	 */
	abstract onClientConnect(client: Bun.ServerWebSocket<WebClientData>): void;
	/**
	 * When a client disconnects from the Server.
	 * @param client 
	 */
	abstract onClientDisconnect(client: Bun.ServerWebSocket<WebClientData>): void;
	/**
	 * When a client sends a message through the Server globally.
	 * Unless the client talks directly to an endpoint, this will always be called on any message.
	 * @param client 
	 * @param message 
	 */
	abstract onClientMessage(client: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>): void;

	/**
	 * When a client wants to directly fetch this endpoint, this method will be called.
	 * This can only execute if the client says it wants to directly talk to this and only this endpoint.
	 * Otherwise, it will execute `onClientMessage` instead.
	 * @param client The client that is fetching this endpoint.
	 * @param message The message that was sent to the client.
	 */
	abstract onClientFetch(client: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>): void;

}

/* Initalize all sub-classes of BaseEndpoint */
const ENDPOINT_PATH = `${import.meta.dir}/`;
export async function reloadEndpoints() {
	console.log("Initializing Endpoints...");

	for await (const file of (new Glob("**/*.ts")).scan(ENDPOINT_PATH)) {
		if (file === import.meta.file) continue;
		await import(`${ENDPOINT_PATH}${file}`);
	}

	const size = BaseEndpoint.registry.size;
	if (size === 0) console.warn("No endpoints were initialized.");
	else console.log(`Successfully initialized ${size} endpoints.`);

	return true;
}