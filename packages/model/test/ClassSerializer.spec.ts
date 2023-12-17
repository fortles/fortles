import assert from "assert";
import { ClassSerializer, ExportedObject } from "../src/utlity/ClassSerializer.js";

class TestClass{
    public pox = 3;
    getPoxPlusOne() {
        return this.pox + 1;
    }
}

class TestClass2{
    public pox = 3;
}

describe("ClassSerializer", function(){
    it("Can serialize and deserialize simple class", function(){
        const serializableClass = new TestClass();
        serializableClass.pox += 1;
        ClassSerializer.register(TestClass);
        const serialized = ClassSerializer.export(serializableClass);
        assert.notEqual(serialized, undefined, "Serialized should exist");
        const deserializedClass: TestClass = ClassSerializer.import(serialized as ExportedObject);
        assert.deepEqual(deserializedClass, serializableClass);
        assert.equal(serializableClass.getPoxPlusOne(), deserializedClass.getPoxPlusOne(), "Restoring functions not worked.");
    });

    it("Throws if not registered the class", function(){
        const serializableClass = new TestClass2();
        const serialized = ClassSerializer.export(serializableClass);
        assert.notEqual(serialized, undefined, "Serialized should exist");
        assert.throws(() => ClassSerializer.import(serialized as ExportedObject));
    });
});