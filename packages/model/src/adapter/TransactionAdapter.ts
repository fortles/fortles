import { Entity, Query } from "../index.js";

/**
 * Handles DML (Data Manipulation Language) operations and transactions,
 * which include CRUD operations (like 'INSERT', 'UPDATE', 'DELETE')
 * as well as transaction control commands like 'START TRANSACTION',
 * 'COMMIT', 'ROLLBACK', etc.
 */
export abstract class TransactionAdapter<NativeConnection>{

    /** Native Connection like SQL */
    protected nativeConnection: NativeConnection;

    /**
     * Creates a new transaction adapter
     * @param nativeConnection The native connection like SQL
     */
    constructor(nativeConnection: NativeConnection){
        this.nativeConnection = nativeConnection;
    }

    /**
     * Creates a new query for the given connection
     * TODO Not sure if this is the transaction adapters job.
     * @param entityType Type of the entity
     */
    public createQuery<E extends Entity>(entityType: new() => E): Query<E>{
        throw Error("Not implemented");
    }

    /**
     * Executes a command on a database.
     * TODO Refactor Maybe the crud operations should be separated
     * @param query Query to execute
     * @returns Number of items modified
     */
    public async execute<E extends Entity>(query: Query<E>): Promise<number>{
        return 0;
    }

    /**
     * Fetches items from the database.
     * TODO Refactor Maybe the crud operations should be separated
     * @param query Query to execute
     * @returns 
     */
    public async *fetch<E extends Entity>(query: Query<E>): AsyncGenerator<E>{
        return 0;
    }

    /** 
     * Begins a new transaction.
     * If the transaction is rollbacked non of the changes will be applied to the database 
     */
    public async beginTransaction(): Promise<void>{

    }

    /**
     * Ends a transaction.
     * All the queries will be finalised on the database
     */
    public async endTransaction(): Promise<void>{

    }

    /**
     * All the changes will be reverted from the database
     */
    public async rollbackTransaction(): Promise<void>{

    }

    /**
     * Runs everithing in a single transaction executed in the callback
     * If any error thrown, the transaction will be reverted, and the error will be thrown again.
     * @param callback 
     * @returns 
     */
    public async transaction<P, R>(callback:  () => Promise<R>): Promise<R>{
        try{
            await this.beginTransaction();
            const result = callback();
            await this.endTransaction();
            return result;
        }catch(error){
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Closes the transaction
     * 
     * Sometimes the resource is not freed after the kill signal is metted.
     * This function should close gracefully the database connection.
     */
    public async close(): Promise<void> {}
}