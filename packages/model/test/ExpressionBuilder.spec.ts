import { Model } from "../src/Model.js";
import { TestUser } from "./model/TestUser.js";
import { TestDriver } from "./utility/TestDriver.js";
import { expression } from "../src/index.js";
import ExpressionQuery from "../src/query/ExpressionQuery.js";

class TestQuery{
    // We mark the function to be processed by the query translator engne.
    @expression
    getSimpleQuery(): ExpressionQuery<TestUser, TestDriver> {
        let asd = {
            pox: "asd"
        };
        return TestUser.query()
            .where(x => x.name == "test" || x.name == asd.pox) as ExpressionQuery<TestUser, TestDriver>;
    }
}

const testQuery = new TestQuery();

describe("Model.Query.ExpressionBuilder", function(){

    this.beforeAll("Prepare Model", async function(){
        await Model.getInstance().setDriver(new TestDriver());
    });

    it("Translates a simple query.", function(){
        const query = testQuery.getSimpleQuery();
    });
});