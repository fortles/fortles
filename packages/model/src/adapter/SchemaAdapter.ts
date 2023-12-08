import { CreateSchemaChange, DropSchemaChange, AlterSchemaChange } from "../index.js";

/**
 * Connects the whole model (all entities) to a given database.
 * 
 * Concerned with DDL (Data Definition Language) operations such as 
 * 'CREATE DATABASE', 'DROP DATABASE', 'CREATE TABLE', 'DROP TABLE', etc.
 */
export abstract class SchemaAdapter<NativeConnection>{

    /** The native connection can be any arbitary class */
    protected nativeConnection: NativeConnection;

    /**
     * Creates a new Schema adapter.
     * @param nativeConnection Arbitary connection that will be called from here.
     */
    constructor(nativeConnection: NativeConnection){
        this.nativeConnection = nativeConnection;
    }

    /**
     * Creates a new table from the schmea.
     * @param schema Schema to create.
     */
    public abstract create(schema: CreateSchemaChange): Promise<void>;

    /**
     * Drops the named table
     * @param name Table name to drop.
     */
    public abstract drop(name: DropSchemaChange): Promise<void>;

    /**
     * Changes a table by the schema definition.
     * @param schema Schame holding the change data.
     */
    public abstract alter(schema: AlterSchemaChange): Promise<void>;

    /**
     * Creates the database that was specified in the connection.
     */
    public async createDatabase(): Promise<void>{

    }

    /**
     * Drops the database that was specified in the connection.
     */
    public async dropDatabase(): Promise<void>{

    }

    /**
     * Destroy all schema and data as well.
     * Drops and recreates the database.
     */
    public async resetDatabase(): Promise<void>{
        await this.dropDatabase();
        await this.createDatabase();
    }
}