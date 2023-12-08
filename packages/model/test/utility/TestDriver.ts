import { CreateSchemaChange, Driver, Entity, EntityAdapter, SchemaChange, SchemaAdapter, Connection, TransactionAdapter, DropSchemaChange, AlterSchemaChange } from "../../src/index.js";

/**
 * Stores the changes itself in the public created, dropped altered arrays.
 */
export class TestSchemaAdapter extends SchemaAdapter<TestDriver>{
    public created: CreateSchemaChange[] = [];
    public dropped: DropSchemaChange[] = [];
    public altered: AlterSchemaChange[] = [];

    override async create(schema: CreateSchemaChange): Promise<void> {
        this.created.push(schema);
    }
    override async drop(name: DropSchemaChange): Promise<void> {
        this.dropped.push(name);
    }
    override async alter(schema: AlterSchemaChange): Promise<void> {
        this.altered.push(schema);
    }

}

export class TestTransactionAdapter extends TransactionAdapter<TestDriver>{

}

export class TestEntityAdapter extends EntityAdapter{
    override importEntity(data: object): Entity {
        throw new Error("Method not implemented.");
    }
    override exportEntity(entity: Entity): object {
        throw new Error("Method not implemented.");
    }
}

export class TestDriver extends Driver<any>{

    public override async createConnection(): Promise<Connection<TestDriver>>{
            return new Connection<TestDriver>(
                this,
                this,
                new TestSchemaAdapter(this),
                new TestTransactionAdapter(this),
                new TestEntityAdapter()
            );
    }

}