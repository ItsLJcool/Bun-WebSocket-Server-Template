
import { type RouteHandler, buildRoutes } from "../api/BaseRoute";
import BaseEndpoint, { reloadEndpoints } from "./endpoints/BaseEndpoint";

// We need to await before we initalize the Server class
const routes: Record<string, RouteHandler> = await buildRoutes();

await reloadEndpoints();

export type WebClientData = { uuid:string };
export default class Server {
	public static readonly HOST = (process.env.HOST ?? "localhost");
	public static readonly PORT = Number(process.env.PORT ?? 3000);

	// public static readonly PAYLOAD_LIMIT = Number( (Number(process.env.PAYLOAD_LIMIT) ?? 16) * (1024 * 1024) ); // 16 MB
	// public static readonly IDLE_TIMEOUT = Number(process.env.IDLE_TIMEOUT ?? 120); // 120 seconds is the Bun Default

	private static instance: Server;

	private _clients = new Set<Bun.ServerWebSocket<WebClientData>>();
	public static get clients() { return Server.get()._clients; }

	private _server: ReturnType<typeof Bun.serve<WebClientData>>;
	public static get bun_serve() { return Server.get()._server; }

	public static get() {
		if (!this.instance) this.instance = new Server();
		return this.instance;
	}

	private _routes: Record<string, RouteHandler> = routes;
	public static get routes() { return Server.get()._routes; }

	private constructor() {
		if (Server.instance) console.error("Attempted to create a new instance of the Server class, yet one already exists.");
		else console.log("Starting Server...");
		
		this._server = Bun.serve<WebClientData>({
			hostname: Server.HOST,
			port: Server.PORT,
			
			routes: this._routes,

			fetch: this.handleFetch.bind(this),

			websocket: {
				data: {} as WebClientData,
				// Causing issues fsr
				// idleTimeout: Server.IDLE_TIMEOUT,
				// maxPayloadLength: Server.PAYLOAD_LIMIT,
				open: this.handleOpen.bind(this),
				message: this.handleMessage.bind(this),
				close: this.handleClose.bind(this),
			}
		});

		console.log(`Server started on ${this._server.protocol}://${Server.HOST}:${Server.PORT}`);
	}

	// public reload() {
	// 	this.server.reload({
	// 		routes: this.routes,
	// 	});
	// }

	private async handleFetch(req: Request, server: Bun.Server<WebClientData>) {
		const url = new URL(req.url);

		if (url.pathname === "/ws") {
			if (server.upgrade(req, { data: { uuid: crypto.randomUUID() } })) return;
			return new Response("Upgrade failed", { status: 500 });
		}

		return new Response("Failed to fetch route.", { status: 404 });
	}

	private async handleOpen(ws: Bun.ServerWebSocket<WebClientData>) {
		ws.subscribe("global");
		this._clients.add(ws);
		BaseEndpoint.registry.forEach(endpoint => endpoint.onClientConnect(ws));
	}

	private async handleMessage(ws: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>) {
		const data = JSON.parse(message.toString());
		const direct_endpoint = data.endpoint ?? data.fetch ?? data.endpoint_name;
		if (direct_endpoint) {
			const endpoint = BaseEndpoint.get(direct_endpoint);
			if (!endpoint) return;
			endpoint.onClientFetch(ws, data.message);
		} else
			BaseEndpoint.registry.forEach(endpoint => endpoint.onClientMessage(ws, data.message));
	}

	private async handleClose(ws: Bun.ServerWebSocket<WebClientData>) {
		ws.unsubscribe("global");
		this._clients.delete(ws);
		BaseEndpoint.registry.forEach(endpoint => endpoint.onClientDisconnect(ws));
	}
}