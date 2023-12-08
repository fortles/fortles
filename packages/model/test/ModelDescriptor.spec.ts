import assert from "assert";
import { before } from "mocha";
import { CreateSchemaChange, Model, ModelChangeType, ModelDescriptor } from "../src/index.js";
import { TestGroup, TestUser } from "./model/index.js";
import { TestModelDescriptor } from "./utility/TestModelDescriptor.js";

describe("ModelDescriptor", function(){
    let modelDescriptor: ModelDescriptor;

    this.beforeEach("Preapre Model", async function(){
        modelDescriptor = await ModelDescriptor.create(['./packages/model/test/model']);

    });

    it("Loads from entities", function(){
        const entityDescriptors = modelDescriptor.getEntityDescriptors();
        assert(entityDescriptors.find(x => x.baseEntityType == TestGroup), "TestGroup is missing.");
        assert(entityDescriptors.find(x => x.baseEntityType == TestUser), "TestUser is missing.");
    });

    it("Detects create changes", function(){
        const changes = modelDescriptor.getChanges(new TestModelDescriptor());

        const testUserChange = changes.get("default")?.find(x => x.getName() == "TestUser");
        assert(testUserChange, "Create change for thrs user should exists.");
        assert(testUserChange instanceof CreateSchemaChange, "We are creating the user.");

        const testGroupChange = changes.get("default")?.find(x => x.getName() == "TestGroup");
        assert(testGroupChange, "Create change for thrs user should exists.");
        assert(testGroupChange instanceof CreateSchemaChange, "We are creating the user.");
    });

    it("Serializes and deserializes", async function(){
        const path = "./temp/serialized-model-descriptor.js";
        await ModelDescriptor.serialize(modelDescriptor, path);
        const deserialized = await ModelDescriptor.deserialize(path);

        // BaseEntityType is needed for building up the model descriptor only.
        // It makes no sense, or even exits when a snapshot is loaded, deserialized.
        let i = 0;
        for(const i in modelDescriptor.getEntityDescriptors()){
            const expectedEntityDescriptor = modelDescriptor.getEntityDescriptors()[i];
            expectedEntityDescriptor.baseEntityType = null;
            const currentEntityDescriptor = deserialized.getEntityDescriptors()[i];
            // Check validations as functions not checked by deep equial
            for(const [name, expectedType] of expectedEntityDescriptor.typeMap){
                const currentType = currentEntityDescriptor.typeMap.get(name);
                assert.equal(expectedType.getValidations().length, currentType?.getValidations().length);
                for(const j in expectedType.getValidations()){
                    const currentValidation = currentType?.getValidations()[j];
                    const expectedValidation = expectedType.getValidations()[j];
                    assert.equal(currentValidation?.toString(), expectedValidation.toString());
                }
                // @ts-ignore
                currentType.validations = expectedType.validations = [];
            }
        }

        // Check the rest
        assert.deepEqual(modelDescriptor, deserialized);
    });
});