import { Driver, Entity, InsertQuery } from "../../index.js";

/**
 * Query adapter
 *
 * What do we expect from a query adapter?
 * Transformation of any query to native query
 * query builds up from conditionsm orders, limit, and we can have conversion from all of them.
 * after this
 */
export abstract class QueryAdapter<NativeConnection>{

    /** The native connection to run queries on */
    protected nativeConnection: NativeConnection;

    /**
     * Creates a new transaction adapter
     * @param nativeConnection The native connection like SQL
     */
    constructor(nativeConnection: NativeConnection){
        this.nativeConnection = nativeConnection;
    }

    abstract insert<E extends Entity>(query: InsertQuery<E, Driver<NativeConnection>>): Promise<number>;

    abstract select<E extends Entity>(query: InsertQuery<E, Driver<NativeConnection>>): Promise<any>;

    abstract update<E extends Entity>(query: InsertQuery<E, Driver<NativeConnection>>): Promise<number>;

    abstract delete<E extends Entity>(query: InsertQuery<E, Driver<NativeConnection>>): Promise<number>;
}