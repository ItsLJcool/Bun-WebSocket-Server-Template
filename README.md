# Bun WebSocket Server (Template)
This is a general WebSocket Template to build off from.

### TODO
- [x] Server Abstraction behind a Class
- [x] Implement API Routes
- [x] Implement WebSocket classes for abstracting different interaction types
- [x] Basic Database using Bun's SQLite for easy and quick user storage (Using Drizzle ORM)
- [ ] Add Redis for it's fast in-memory storage, useful for WebSockets.
- [ ] WebSocket Authentication
	- [x] Allow "Guest" WebSockets


To install the dependencies, run `bun install`. You can then run `bun start` to start the server directly.
You can also use of the following:
- `bun dev`
	- Starts with development information. [Not done yet]
- `bun start`
	- Normal production starting.
- `bun watch`
	- Watches for changes in the filesystem, and restarts the program when a file is modified.

