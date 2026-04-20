import { BaseRoute } from "../Route";
import { type BunRequest } from "bun";

export default class HelloRoute extends BaseRoute {
	path = "/api/hello";
	handlers = {
		GET: (req:BunRequest) => {
			console.log("GET", req);
			return new Response("Hello World!");
		},
	};
}