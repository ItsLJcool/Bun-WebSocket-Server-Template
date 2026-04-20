import { Glob, type BunRequest } from "bun";

export type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export abstract class BaseRoute {
	abstract path: string;
	abstract handlers: Record<string, RouteHandler> | RouteHandler;
}

const ROUTE_PATH = `${import.meta.dir}/routes/`;

export async function buildRoutes() {
	console.log("Building Routes...");

	const routeGlob = new Glob("**/*.ts");
	const routes:Record<string, RouteHandler> = {}
	
	for await (const file of routeGlob.scan(ROUTE_PATH)) {
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