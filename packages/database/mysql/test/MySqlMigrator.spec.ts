import { Model, ModelDescriptor } from "@fortles/model";
import { MySqlDriver } from "../src/MySqlDriver.js";

describe("Database.MySql.Migration", function(){

    this.beforeAll("Preapre tables", async function(){
        await Model.getInstance().setDriver(new MySqlDriver("default", {
            port: 3306,
            database: "test_fortles",
            user: "root"
        }));
    });

    it("Can create tables", async function(){
        await Model.getInstance().getMigrationRunner().migrateConnectionFromSnapshot(new ModelDescriptor());
        const connection = Model.getConnection();
        const [rows, fields] = await connection.getNativeConnection().query("SHOW TABLES");
        console.log(rows);
    });
});