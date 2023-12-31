import { EntityFieldDecorator, TypeUtility, Entity, ErrorReporter, StringType } from "../index.js";

export type EmailTypeConfig = {
    length?: number,
    checkMx?: false
};

export class EmailType extends StringType{

    public override parse(input: string, reporter: ErrorReporter): string {
        return input;
    }
    
    constructor(name: string | symbol, config: EmailTypeConfig = {length: 80}){
        super(name, {
            length: config.length,
            fixed: false
        });
    }
}

export function email(config?: EmailTypeConfig): EntityFieldDecorator {
    return function(value: Entity, context: ClassFieldDecoratorContext): void{
        TypeUtility.setType(null, context.name, new EmailType(context.name, config));
    };
}