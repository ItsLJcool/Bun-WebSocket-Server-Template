
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

import { BaseDB } from "./base";


export default class UserDB extends BaseDB {

	// Singleton
	static instance: UserDB;
	static get() {
		if (!UserDB.instance) UserDB.instance = new UserDB();
		return UserDB.instance;
	}

	constructor() {
		super();
		if (!UserDB.instance) UserDB.instance = this;
	}

	// Initalize the table for this DB Table Class
	static override table = sqliteTable("users", {
		id: text("id").primaryKey(),
		username: text("username").notNull(),
	});

	// Since you are manually talking to SQLite, you need to manually create the table if it doesn't exist.
	// Including handling migrations.
	static {
	this.db.run(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL
		)
	`);
	}

	/**
	 * Creates a new User in the Database Table.
	 * @param id 
	 * @param username 
	 * @returns `true` if the new user was created successfully, `false` otherwise.
	 */
	static async create(id: string, username: string):Promise<boolean> {
		if (await this.getById(id) != undefined) return false
		await this.db.insert(this.table).values({
			id,
			username,
		});
		return true;
	}

	/**
	 * Gets a User from the Database Table by their ID.
	 * @param id 
	 * @returns Record of the User in the Database Table.
	 */
	static async getById(id: string) {
		return await this.db
			.select()
			.from(this.table)
			.where(eq(this.table.id, id))
			.get();
	}

	// example of updating a variable in the database table
	// static async updateScore(id: string, score: number) {
	// 	await this.db
	// 		.update(this.table)
	// 		.set({ score })
	// 		.where(eq(this.table.id, id));
	// }

	/**
	 * Deletes a User from the Database Table by their ID.
	 * @param id 
	 */
	static async delete(id: string) {
		await this.db.delete(this.table).where(eq(this.table.id, id));
	}

	/**
	 * Gets all Users from the Database Table.
	 * @returns Record of all Users in the Database Table.
	 */
	static async getAll() {
		return await this.db
			.select()
			.from(this.table)
			.all();
	}
}