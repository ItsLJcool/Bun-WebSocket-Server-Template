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

export abstract class BaseRoute {
	abstract path: string;
	abstract handlers: Record<string, RouteHandler> | RouteHandler;
}

/* Below is just the hanlder for Server Setup */
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