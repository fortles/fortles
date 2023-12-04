import { Connection, DropSchemaChange, EntityDescriptor, SchemaChange, Type, TypeProperty } from "../index.js";

/**
 * Schema for creating a new table.
 */
export class CreateSchemaChange extends SchemaChange{

    /** Filed name and the corresponding type infromations. */
    protected createFieldMap = new Map<string, Type<any, any>>();

    public addField(name: string, type: Type<any, any>){
        return new AddFieldSchemaOperation(this, type);
    }

    /**
     * Returns the map of the field names and type informations.
     */
    public getCreateFieldMap(){
        return this.createFieldMap;
    }

    /**
     * Apllies this schema to a connection.
     * @param connection Connection to execute.
     */
    public override async applyTo(connection: Connection): Promise<void> {
        return connection.getSchema().create(this);
    }
    
    /**
     * Creates schema and its reverse.
     * @param entityDescriptor Create the schema from this descriptor.
     * @returns The change
     */
    public static createFromEntityDescriptor(entityDescriptor: EntityDescriptor): CreateSchemaChange{
        const schemaChanage = new this(entityDescriptor.getName());
        //TODO Association types should be converted
        schemaChanage.createFieldMap = entityDescriptor.typeMap;
        schemaChanage.reversed = new DropSchemaChange(entityDescriptor.getName());
        return schemaChanage;
    }
}

/**
 * Special class for chaning operations
 */
export class AddFieldSchemaOperation<S extends SchemaChange> {

    /** SchemaChange to operate on */
    protected schemaChange: CreateSchemaChange;

    /** Current field */
    protected type: Type<any, any>;

    /**
     * Creates an operation
     * @param schemaChange Schema change to operate on
     * @param type Type of the current field
     */
    constructor(schemaChange: CreateSchemaChange, type: Type<any, any>){
        this.schemaChange = schemaChange;
        this.type = type;
    }

    /**
     * Marks the field as primary key.
     * @returns Self for chaining.
     */
    public primaryKey(): this{
        this.type.setProperty(TypeProperty.PRIMARY_KEY, null);
        return this;
    }

    /**
     * Adds a new field to the table.
     * It moves back from the operation the the schema change.
     * @param name Name of the new field
     * @param type Type of the new field
     * @returns The operation of the new field.
     */
    public addField(name: string, type: Type<any, any>){
        return this.schemaChange.addField(name, type);
    }
}