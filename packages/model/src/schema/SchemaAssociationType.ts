import { AssociationType, CreateSchemaChange } from "../index.js";

/**
 * Wrapper class for association
 * 
 * Original assocations have entities at the end points, but we can have only schemes.
 */
export class SchemaAssociationType<A extends AssociationType<any>>{

    protected associationType: A;

    /** Create schema has all the required information to set up a connection */
    //protected source: CreateSchemaChange;

    //protected target: CreateSchemaChange;

    constructor(associationType: A){
        this.associationType = associationType;
    }
}