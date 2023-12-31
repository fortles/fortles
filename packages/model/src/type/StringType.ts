import { Type, EntityFieldDecorator, TypeUtility, Entity, ErrorReporter } from "../index.js";

export type StringTypeConfig = {
    fixed?: boolean,
    length?: number
};

export class StringType extends Type<string, StringTypeConfig>{

    public parse(input: string, reporter: ErrorReporter): string {
        return input;
    }

    constructor(name: string | symbol, config: StringTypeConfig = {length: 80}){
        super(name, config);
    }
}

export function string(config?: StringTypeConfig): EntityFieldDecorator {
    return function(value: undefined, context: ClassFieldDecoratorContext): void{
        TypeUtility.setType(null, context.name, new StringType(context.name, config));
    };
}