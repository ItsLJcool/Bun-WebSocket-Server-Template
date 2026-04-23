import { Glob, type BunRequest } from "bun";

/*
	|# The `BaseRoute` class just abstracts the `routes` object into a class type.	#|
	|# 			You can use to call and branch out as a service if needed.			#|
	|#																				#|
	|# 			Read the Routing documentation if you need more information:		#|
	|# 					https://bun.com/docs/runtime/http/routing 					#|
	|#																				#|
*/

export type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

const ROUTE_PATH = `${import.meta.dir}/routes/`;
export async function buildRoutes() {
	console.log("Building Routes...");

	const routes:Record<string, RouteHandler> = {}
	
	for await (const file of (new Glob("**/*.ts")).scan(ROUTE_PATH)) {
		const mod: any = await import(`${ROUTE_PATH}${file}`);

		const RouteClass = mod.default ?? mod.Route ?? Object.values(mod)[0];
		
		if (RouteClass) {
			const route = new RouteClass();
			routes[route.path] = route.handlers;
		}
		else console.error(`Failed to build route from ${file}`);
	}

	const size = Object.keys(routes).length;
	if (size === 0) console.warn("No routes were built.");
	else console.log(`Successfully built ${size} routes.`);

	return routes;
}

export default abstract class BaseRoute {
	/** The collection of all route registered. */
	public static registry = new Map<string, BaseRoute>();
	public static get server_routes():Record<string, RouteHandler | Record<string, RouteHandler>> {
		const routes:Record<string, RouteHandler | Record<string, RouteHandler>> = {};
		for (const [path, route] of BaseRoute.registry) routes[path] = route.handlers;
		return routes;
	}

	/**
	 * Attempts to register a new route as a singleton into the registry.
	 * If the endpoint is already registered, it will not register.
	 * @param this The class (itself commonly) to register.
	 * @returns boolean
	 */
	protected static register<T extends BaseRoute>(this: new () => T):boolean {
		const instance = new this();
		if (BaseRoute.registry.has(instance.path)) {
			console.error(`Attempted to register a route with the path "${instance.path}", but one already exists. Will not register.`);
			return false;
		}
		BaseRoute.registry.set(instance.path, instance);
		return true;
	}


	abstract path: string;
	abstract handlers: Record<string, RouteHandler> | RouteHandler;
}

/* Initalize all sub-classes of BaseRoute */
const ROUTES_PATH = `${import.meta.dir}/routes/`;
export async function reloadRoutes() {
	console.log("Initializing Routes...");

	for await (const file of (new Glob("**/*.ts")).scan(ROUTES_PATH)) await import(`${ROUTES_PATH}${file}`);

	const size = BaseRoute.registry.size;
	if (size <= 0) console.warn("No routes were initialized.");
	else console.log(`Successfully initialized ${size} routes.`);

	return true;
}