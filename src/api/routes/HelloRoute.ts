import BaseRoute from "../BaseRoute";
import { type BunRequest } from "bun";

export default class HelloRoute extends BaseRoute {
	path = "/api/hello";
	handlers = {
		GET: (req:BunRequest) => {
			return new Response("Hello World!");
		},
	};

	static {
		this.register();
	}
}