
import BaseRoute, { reloadRoutes } from "../api/BaseRoute";
import BaseEndpoint, { reloadEndpoints } from "./endpoints/BaseEndpoint";

// Reload the routes & endpoints, in which it also registers them
await reloadRoutes();
await reloadEndpoints();

export type WebClientData = { uuid:string, is_guest:boolean };
export default class Server {
	/** Quick access to the port the server is running*/
	public static get port():number { return this.instance._server.port ?? Number(process.env.PORT ?? 3000); }

	/** Whether or not to allow websocket upgrades. */
	public static ALLOW_WEBSOCKET_UPGRADE:boolean = true;

	// public static readonly PAYLOAD_LIMIT = Number( (Number(process.env.PAYLOAD_LIMIT) ?? 16) * (1024 * 1024) ); // 16 MB
	// public static readonly IDLE_TIMEOUT = Number(process.env.IDLE_TIMEOUT ?? 120); // 120 seconds is the Bun Default

	/** The singleton instance of the Server class. */
	private static instance:Server;

	/** The set of all connected clients. */
	private _clients = new Set<Bun.ServerWebSocket<WebClientData>>();
	/** Quick access to the connected clients. */
	public static get clients() { return Server.get()._clients; }

	/** The Bun.serve instance. */
	private _server:ReturnType<typeof Bun.serve<WebClientData>>;
	/** Quick access to the Bun.serve instance. */
	public static get bun_serve() { return Server.get()._server; }

	/** Gets the singleton instance of the Server class. */
	public static get() {
		if (!this.instance) this.instance = new Server();
		return this.instance;
	}

	private constructor() {
		if (Server.instance) throw new Error("Attempted to create a new instance of the Server class, yet one already exists.");
		else console.log("Starting Server...");
		
		this._server = Bun.serve<WebClientData>({
			port: Number(process.env.PORT ?? 3000),
			
			routes: BaseRoute.server_routes,

			fetch: this.handleFetch.bind(this),

			websocket: {
				sendPings: true,
				data: {} as WebClientData,
				// Causing issues fsr
				// idleTimeout: Server.IDLE_TIMEOUT,
				// maxPayloadLength: Server.PAYLOAD_LIMIT,
				message: this.handleMessage.bind(this),
				open: this.handleOpen.bind(this),
				close: this.handleClose.bind(this),
				drain: this.handleDrain.bind(this),
				ping: this.handlePing.bind(this),
				pong: this.handlePong.bind(this),
			}
		});

		console.log(`Server started on ${this._server.url}`);
	}

	/** Here you can add logic to determine if the request should be checked for a websocket upgrade. */
	private attempt_upgrade(req: Request, server: Bun.Server<WebClientData>):boolean {
		if (!Server.ALLOW_WEBSOCKET_UPGRADE) return false;
		const url = new URL(req.url);

		// You can parse the request, and check for any Handshake headers if you need to.

		return url.pathname.startsWith("/ws");
	}

	/** This is called when we want to initiate a websocket upgrade, with data alongside the client. */
	private upgrade_data():{data:WebClientData} {
		return {data: { uuid: crypto.randomUUID(), is_guest: true }};
	}

	/** Handles the fetch requests. */
	private async handleFetch(req: Request, server: Bun.Server<WebClientData>) {
		
		if (this.attempt_upgrade(req, server)) {
			if (server.upgrade(req, this.upgrade_data())) return;
			return new Response("Upgrade failed", { status: 500 });
		}

		return new Response("Failed to fetch route.", { status: 404 });
	}

	/** Handles the websocket open event. */
	private async handleOpen(ws: Bun.ServerWebSocket<WebClientData>) {
		ws.subscribe("global");
		this._clients.add(ws);
		BaseEndpoint.registry.forEach(endpoint => endpoint.onClientConnect(ws));
	}

	/** Handles the websocket message event. */
	private async handleMessage(ws: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>) {
		let isJson = false;
		if (typeof message === "string") {
			let data:any;
			try {
				data = JSON.parse(message);
				isJson = true;
			} catch {}

			if (isJson) {
				const direct_endpoint = data.endpoint ?? data.fetch ?? data.endpoint_name;
				if (direct_endpoint) {
					const endpoint = BaseEndpoint.get(direct_endpoint);
					if (!endpoint) return;
					endpoint.onClientFetch(ws, data);
				} else
					BaseEndpoint.registry.forEach(endpoint => endpoint.onClientMessage(ws, data));
			}
		} else
			BaseEndpoint.registry.forEach(endpoint => endpoint.onClientMessage(ws, message));
	}

	/** Handles the websocket close event. */
	private async handleClose(ws: Bun.ServerWebSocket<WebClientData>) {
		ws.unsubscribe("global");
		this._clients.delete(ws);
		BaseEndpoint.registry.forEach(endpoint => endpoint.onClientDisconnect(ws));
	}

	/** Handles the websocket drain event. */
	private async handleDrain(ws: Bun.ServerWebSocket<WebClientData>) {
		// console.log("Drain event received... uhhhhhh");
	}

	/** Handles the websocket ping event. */
	private async handlePing(ws: Bun.ServerWebSocket<WebClientData>, data: Buffer) {
		// console.log("Ping event received... uhhhhhh");
	}

	/** Handles the websocket pong event. */
	private async handlePong(ws: Bun.ServerWebSocket<WebClientData>, data: Buffer) {
		// console.log("Pong event received... uhhhhhh");
	}
}