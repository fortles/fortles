import { HasOneAssociationType, TypeAdapter } from "@fortles/model";

export class HasOneMySqlTypeAdapter extends TypeAdapter<HasOneAssociationType, any, any, any>{

    //Contians if an entity and a type
    //Should be able to import the type as well.
    //2 query or include?
    
    override exportData(value: any) {
        throw new Error("Method not implemented.");
    }
    override importData(value: any) {
        throw new Error("Method not implemented.");
    }
    override exportSchema() {
        const fieldName = this.type.getName() + "Id";
        
    }
    override importSchema(definition: any): HasOneAssociationType {
        throw new Error("Method not implemented.");
    }

}