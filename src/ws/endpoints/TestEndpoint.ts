import { type WebClientData } from "../Server";
import BaseEndpoint from "./BaseEndpoint";

export default class TestEndpoint extends BaseEndpoint {
	static {
		this.register();
	}

	name = "Test";

	async onClientConnect(client: Bun.ServerWebSocket<WebClientData>) {
		console.log("Client connected! UUID:", client.data.uuid);
		client.send("Hello World!");
	}

	async onClientDisconnect(client: Bun.ServerWebSocket<WebClientData>) {
		console.log("Client disconnected!");
	}

	async onClientMessage(client: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>) {
		console.log("Client message received:", message);
	}

	async onClientFetch(client: Bun.ServerWebSocket<WebClientData>, message: string | Buffer<ArrayBuffer>) {
		console.log("Client directly fetching this endpoint:", message);
	}
}