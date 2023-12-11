import assert from "assert";
import { CreateSchemaChange, DropSchemaChange, HasManyAssociationType, Model, ModelDescriptor, SchemaChange } from "../src/index.js";
import { TestUser } from "./model/index.js";
import { TestGroup } from "./model/TestGroup.js";
import { TestDriver, TestSchemaAdapter } from "./utility/TestDriver.js";
import { AssociationTypeDescriptor } from "../src/type/AssociationTypeDescriptor.js";

describe("Model", function(){

    this.beforeAll("Preapre connection", function(){
        Model.getInstance().setDriver(new TestDriver("default"));
    });

    describe("Migration", function(){
        this.beforeAll("Preapre Model", async function(){
            await Model.getInstance().getModelDescriptor().addFolder("./packages/model/test/model");
        });

        it("Has correct descriptors", function(){
            const entityDescriptors = Model.getInstance().getModelDescriptor().getEntityDescriptors();
            assert(entityDescriptors.find(x => x.baseEntityType == TestGroup), "TestGroup is missing.");
            assert(entityDescriptors.find(x => x.baseEntityType == TestUser), "TestUser is missing.");
        });

        it("Has the correct changes", function(){
            const modelDescriptor = Model.getInstance().getModelDescriptor();
            const changesMap = modelDescriptor.getChanges(new ModelDescriptor());
            assert.equal(changesMap.get("default")?.length, 2, "There should be 2 changes");
            const changes = changesMap.get("default") as SchemaChange[];

            // TestGroup
            assert(changes[0] instanceof CreateSchemaChange, "Changes should be create one.");
            assert.equal(changes[0].getName(), "TestGroup", "TestGroup should be created first.");
            assert(changes[0].getReversed() instanceof DropSchemaChange, "The reverse should be a drop change.");

            // TestUser
            assert(changes[1] instanceof CreateSchemaChange, "Changes should be create one.");
            assert.equal(changes[1].getName(), "TestUser", "TestUser should be created second.");
            assert(changes[1].getReversed() instanceof DropSchemaChange, "The reverse should be a drop change.");

            // Check if the association types are replaced to the schema association type.
            // Its needed as we cant infer extra information from a past state of an entity, thats why
            // Schemas are fully separated.

            const usersFieldInTestGroup = changes[0].getCreateFieldMap().get("users");
            assert(usersFieldInTestGroup instanceof AssociationTypeDescriptor, 
                "Users field in TestGroup should have transferred to SchemaAssociationType");
        });

        it("Runs migration from a snapshot", async function(){
            await Model.getInstance().getMigrationRunner().migrateConnectionFromSnapshot(new ModelDescriptor());
            assertSchema();

        });
    });


    xit("Saves and loads the migration", function(){
        const migrationRunner = Model.getInstance().getMigrationRunner();
        
        assert.throws(
            async () => migrationRunner.saveMigrationFromCurrentSnapshot("test"),
            /.+/,
            "With no baseline there should be an error."
        );
        // @ts-ignore Create an empty baseline snapshot. As before all already loads the model we can do it othervise.
        migrationRunner.baselineSnapshot = new ModelDescriptor();

        migrationRunner.saveMigrationFromCurrentSnapshot("test");

        // 
        migrationRunner.migrate();

        assertSchema();
    });
});

function assertSchema(){
    const schemaAdapter = Model.getConnection().getSchema() as TestSchemaAdapter;
    assert.notEqual(schemaAdapter.created.length, 0,
        "There should be changes.");

    //TestGroup creation
    const testGroupChange = schemaAdapter.created[0];

    assert.notEqual(testGroupChange, undefined,
        "The TestGroup cration change must exist.");

    assert.equal(testGroupChange.getName(), TestGroup.name,
        "TestGroup should be created second.");

    //TestUser creation
    const testUserChange = schemaAdapter.created[1];

    assert.notEqual(testUserChange, undefined,
        "The TestUser creation change must exist.");

    assert.equal(testUserChange.getName(), TestUser.name,
        "TestUser should be created third.");
}