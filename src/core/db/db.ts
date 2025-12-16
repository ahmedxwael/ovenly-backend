import { Collection, Db } from "mongodb";

export class Database {
  private database: Db | null = null;

  public setDatabase(db: Db): Database {
    if (this.database) {
      throw new Error("Database already set");
    }

    this.database = db;
    return this;
  }

  public collection(name: string): Collection {
    if (!this.database) {
      throw new Error("Database not set");
    }
    return this.database.collection(name);
  }
}

export const db = new Database();
