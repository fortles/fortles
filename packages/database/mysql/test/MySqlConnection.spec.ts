import { MySqlDriver } from "../src/index.js";

describe("Database.MySql.Connection", function(){
    it("Can connect to the database", async function(){
        const driver = new MySqlDriver("default", {
            port: 3306,
            database: "fortles_test",
            user: "root"
        });
        const connection = await driver.createConnection();
        let result = await connection.getNativeConnection().execute("SHOW TABLES");

        connection.close();
    });
});