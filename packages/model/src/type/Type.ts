import { Entity, ErrorReporter, TypeUtility } from "../index.js";
import { Exportable, ExportedData, ClassSerializer } from "../utlity/ClassSerializer.js";

export type EntityFieldDecorator = (value: any, context: ClassFieldDecoratorContext) => void;

/**
 * Callable, that returns null on success, and the error message on fail.
 */
export type Validation<T> = (value: T) => string | null

/**
 * - Validation
 * - Conversion (serialization, deserialization, sql->extendable)
 * - Formatting
 */
export abstract class Type<T,C> implements Exportable{

    /**
     * Property map, the key is the type of the property,
     * and the value as an arbitary objext that holds the information of the property.
     */
    protected propertyMap = new Map<string, any>();

    protected validations: Validation<T>[] = [];

    /**
     * Name of the field
     */
    protected name: string;

    /**
     * Configuration for the type
     */
    protected config: C;

    /**
     * Creates a new type
     * @param name Field name
     * @param config Configuration
     * @param propertyMap Properites in a name value Map
     * @param validations Validations
     */
    public constructor(
        name: string | symbol, 
        config: C, propertyMap: Map<string, Object> = new Map<string, Object>(), 
        validations: Validation<T>[] = []
    ){
        this.name = name && name.toString();
        this.config = config;
        this.propertyMap = propertyMap;
        this.validations = validations;
        ClassSerializer.register(this.constructor as any);
    }

    /**
     * Sets a property
     * @param name Name of the property
     * @param value Value of the property
     */
    public setProperty(name: string, value: Object|null = null): void{
        this.propertyMap.set(name, value);
    }

    /**
     * Gets a property
     * @param name Name of the property
     * @returns The property or undefined
     */
    public getProperty(name: string): Object{
        return this.propertyMap.get(name);
    }

    /**
     * Gets the configuration
     * @returns the configuration object
     */
    public getConfig(): C{
        return this.config;
    }

    /**
     * Check if this tipe has a property.
     * @param name Name of the property.
     * @returns true if has false othervise.
     */
    public hasProperty(name: string): boolean{
        return this.propertyMap.has(name);
    }

    /**
     * Name of the field
     */
    public getName(): string{
        return this.name;
    }

    /**
     * Adds a validation
     * @param validation A validation is a callable, that should return null on success, the error message on fail.
     */
    public addValidation(validation: Validation<T>): void{
        this.validations.push(validation);
    }

    /**
     * Parses a value what was given on the user side. Validations wil run on successful parsing.
     * @param input Input to process
     * @param errorReporter Report errors here if the conversion fails. If an error were reported, the parsing fails regardless of the output.
     * @returns The converted value, or null if the input recognised as a null value.
     */
    public abstract parse(input: string, errorReporter: ErrorReporter): T|null;

    /**
     * Validates a property with the given rules.
     * validation happens after parsing to the target type.
     * @param value Value to valudate
     * @returns Array of the errors
     */
    public validate(value: T): string[]{
        let errors: string[] = [];
        for(let validation of this.validations){
            let result = validation(value);
            if(result != null){
                errors.push(result);
            }
        }
        return errors;
    }

    /**
     * Returns the custom properties for the given type.
     * @returns Property map
     */
    public getPropertyMap(){
        return this.propertyMap;
    }

    /**
     * Returns the validations of the give type.
     * @returns Array of validations.
     */
    public getValidations(): Validation<T>[]{
        return this.validations;
    }

    public equials(type: Type<any,any>): boolean{
        //TODO We should do some better checking here
        return this == type;
    }

    public export(): ExportedData {
        return{
            type: this.constructor.name,
            name: this.name,
            config: this.config,
            propertyMap: Array.from(this.propertyMap.entries()),
            //TODO: investigetae vether validators should be exported.
            //validations: this.validations
        };
    }

    public import(source: ExportedData): void {
        this.name = source.name;
        this.config = source.config;
        this.propertyMap = new Map(source.propertyMap);
        //TODO: investigetae vether validators should be exported.
        //this.validations = source.validations;
    }
}

export enum TypeProperty{
    PRIMARY_KEY = "primaryKey",
    GENERATED = "generated",
    HAS_ONE = "hasOne",
    HAS_MANY = "hasMany",
    BELONGS_TO = "belongsTo",
    BELONGS_TO_MANY = "belongsToMany",
    NULLABLE = "nullable"
}

/**
 * Makes a field read only
 */
export function readonly(value: any, context: ClassFieldDecoratorContext, descriptor: PropertyDescriptor) {
    descriptor.writable = false;
    return descriptor;
}  

/**
 * Marks the field as primary key
 */
export function primaryKey(value: undefined, context: ClassFieldDecoratorContext){
    TypeUtility.setTypeProperty(null, context.name, TypeProperty.PRIMARY_KEY);
}

/**
 * Marks the field as generated.
 * 
 * Generated fields are readonly, and can be set programatically.
 */
export function generated(value: undefined, context: ClassFieldDecoratorContext) {
    TypeUtility.setTypeProperty(null, context.name, TypeProperty.GENERATED);
}

/**
 * Marks the type as nullable.
 */
export function nullable(value: undefined, context: ClassFieldDecoratorContext) {
    TypeUtility.setTypeProperty(null, context.name, TypeProperty.NULLABLE);
}