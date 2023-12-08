import { TransactionAdapter } from "@fortles/model";
import { PoolConnection } from "mysql2/promise";

export class MySqlTransactionAdapter extends TransactionAdapter<PoolConnection>{
    public override async close(): Promise<void> {
        this.nativeConnection.destroy();
    }
}