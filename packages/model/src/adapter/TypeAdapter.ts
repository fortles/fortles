import { Type } from "../index.js";
/**
 * Connects each type to the database.
 * Handles how the type definitions from the Entity exported to the database,
 * and handles the export import from the databases native types.
 */
export abstract class TypeAdapter<T extends Type<I,any>, I, O, S>{

    constructor(protected type: T){

    }

    /**
     * If set the export will be skipped.
     * 
     * If the data is dispalyed as it comes from the database it can skip the export / import step.
     */
    protected skipExport: boolean = false;

    /**
     * Export a field from the Entity from its given type to the databases natvie type.
     * @param value Value in the entity.
     */
    abstract exportData(value: I): O;

    /**
     * Imports a field from the Entity from its given type to the databases natvie type.
     * @param value Value in the database.
     */
    abstract importData(value: O): I;

    /**
     * Export the definition from an Entity field to the databases DDL.
     */
    abstract exportSchema(): S;

    /**
     * Import a definition from the databases DDL to an Entity type.
     * @param definition The DDL from the database to the given type.
     */
    abstract importSchema(definition: S): T;
}