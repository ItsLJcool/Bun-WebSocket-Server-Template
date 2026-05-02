import Server from "./ws/Server.ts";

import UserDB from "./db/user.db.ts";

// Start initalizing database Tables here.
UserDB.get();

// Initalizes the server, and returns as a singleton.
Server.get();