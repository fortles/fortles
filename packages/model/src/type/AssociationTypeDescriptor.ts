import { ErrorReporter } from "../ErrorReporter.js";
import { EntityDescriptor } from "../index.js";
import { ClassSerializer, Exportable, ExportedData } from "../utlity/ClassSerializer.js";
import { AssociationType } from "./AssociationType.js";
import { Type } from "./Type.js";

/**
 * A wrapper for assocation types.
 * 
 * AssociationTypes are dependent on entities, but they are prone to change in development.
 * They are converted to Association types to froze the state of associations.
 */
export class AssociationTypeDescriptor extends Type<any, any>{

    /** Type of the original assoication */
    public type?: typeof AssociationType;

    public source?: EntityDescriptor;

    public target?: EntityDescriptor;

    public override parse(input: string, errorReporter: ErrorReporter) {
        throw new Error("Its a technical type and this function should not be called");
    }

    public override export(): ExportedData {
        const result = super.export();
        result.source = ClassSerializer.export(this.source);
        result.target = this.target;
        return result;
    }

    public override import(source: ExportedData): void {
        super.import(source);
        this.source = source.source;
        this.target = source.target;
    }
}