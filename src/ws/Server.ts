
import { BaseRoute, type RouteHandler, buildRoutes } from "../api/Route";
import { type BunRequest } from "bun";

const routes = await buildRoutes();

export type WSData = {};
export default class Server {
	public static readonly HOST = (process.env.HOST ?? "localhost");
	public static readonly PORT = Number(process.env.PORT ?? 3000);

	// public static readonly PAYLOAD_LIMIT = Number( (Number(process.env.PAYLOAD_LIMIT) ?? 16) * (1024 * 1024) ); // 16 MB
	// public static readonly IDLE_TIMEOUT = Number(process.env.IDLE_TIMEOUT ?? 120); // 120 seconds is the Bun Default

	private static instance: Server;

	public clients = new Set<Bun.ServerWebSocket<WSData>>();
	private server: ReturnType<typeof Bun.serve<WSData>>;

	public static get() {
		if (!this.instance) this.instance = new Server();
		return this.instance;
	}

	private routes: Record<string, RouteHandler> = routes;

	private constructor() {
		if (Server.instance) console.error("Attempted to create a new instance of the Server class, yet one already exists.");
		else console.log("Starting Server...");
		
		console.log(this.routes);
		this.server = Bun.serve<WSData>({
			routes: this.routes,
			hostname: Server.HOST,
			port: Server.PORT,

			fetch: this.handleFetch.bind(this),

			websocket: {
				data: {} as WSData,
				// idleTimeout: Server.IDLE_TIMEOUT,
				// maxPayloadLength: Server.PAYLOAD_LIMIT,
				open: this.handleOpen.bind(this),
				message: this.handleMessage.bind(this),
				close: this.handleClose.bind(this),
			}
		});

		console.log(`Server started on ${this.server.protocol}://${Server.HOST}:${Server.PORT}`);
	}

	public reload() {
		this.server.reload({
			routes: this.routes,
		});
	}

	private handleFetch(req: Request, server: Bun.Server<WSData>) {
		const url = new URL(req.url);

		if (url.pathname === "/ws") {
			if (server.upgrade(req, { data: {} })) return;
			return new Response("Upgrade failed", { status: 500 });
		}

		return new Response("OK");
	}

	private handleOpen(ws: Bun.ServerWebSocket<WSData>) {
		ws.subscribe("global");
		this.clients.add(ws);
	}

	private handleMessage(ws: Bun.ServerWebSocket<WSData>, message: string) {
		// TODO: Make it parse message and direct messages to the correct classes.
	}

	private handleClose(ws: Bun.ServerWebSocket<WSData>) {
		ws.unsubscribe("global");
		this.clients.delete(ws);
	}
}