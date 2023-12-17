import { Connection, Driver, Entity, TransactionAdapter } from "../index.js";

export class Query<E extends Entity, D extends Driver<any> = Driver<any>> implements Iterable<E>{

    protected entityType: new() => E;

    protected transactionAdapter: TransactionAdapter<D>

    constructor(entityType: new() => E, transactionAdapter: TransactionAdapter<D>){
        this.entityType = entityType;
        this.transactionAdapter = transactionAdapter;
    }

    /**
     * Iterator is the key function for retriving any kind of data
     */
    [Symbol.iterator](): Iterator<E, any, undefined>{
        throw Error("Not implemented");
    }

    protected run(){

    }

    public async update(){

    }

    public async get(){

    }

    public where(condition: (item: E) => boolean): this{
        return this;
    }

    public limit(value: number){
        return this;
    }

    /**
     * Returns the first element matching this query.
     * @returns The entity or null
     */
    public async first(): Promise<E|null>{
        this.limit(1);
        for(let item of this){
            return item;
        }
        return null;
    }

    public orderBy(field: (item:E) => any): this{
        return this;
    }


    public toArray(): E[]{
        return Array.from(this);
    }
    
    
}