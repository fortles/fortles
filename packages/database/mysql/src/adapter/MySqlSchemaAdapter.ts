import { SchemaAdapter, DropSchemaChange, CreateSchemaChange, AlterSchemaChange } from "@fortles/model";
import { PoolConnection } from "mysql2/promise";
export class MySqlSchemaAdapter extends SchemaAdapter<PoolConnection> {

    override async create(schema: CreateSchemaChange): Promise<void> {
        let statement = "CREATE TABLE " + schema.getName() + " (\n";
        let isFirst = true;
        for(const [name, type] of schema.getCreateFieldMap()){
            if(!isFirst){
                statement += ",\n";
            }
            statement += "`" + name + "`"
        }
        statement += "\n);"
        await this.nativeConnection.execute(statement);
    }


    override async drop(schema: DropSchemaChange): Promise<void> {
        const statement = "DROP TABLE `" + schema.getName() + "`;";
        await this.nativeConnection.execute(statement)
    }

    override async alter(schema: AlterSchemaChange): Promise<void> {
        throw new Error("Method not implemented.");
    }

}