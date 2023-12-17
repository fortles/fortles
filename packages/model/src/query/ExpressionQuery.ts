import { Driver, Entity, Expression, ExpressionBuilder, Query } from "../index.js";

/**
 * Expression Query
 * 
 * Expression query for database types that are not controlled programatically.
 * It can be used for string and object based communcations as well.
 * 
 * TODO Refactor will be moved under adapters
 * 
 * Query should be QueryBuilder or should directly send data to a QueryAdapter.
 * For each query and query part there should be q Query adapter in the cache
 * Those adapters should be executed when the querz is read.
 * Probably they should build a tree.
 */
export default class ExpressionQuery<E extends Entity, D extends Driver<any>> extends Query<E, D>{

    protected whereExpressions: Expression[] = [];
    protected orderByExpressions: Expression[] = [];
    

    public override where(condition: (item: E) => boolean): this {
        // The second argument is a type parameter.
        const variables = arguments[1];
        if(variables == undefined){
            throw new Error("Mark this function with the '@expression' decorator!");
        }

        //this.expressionBuilder.build(condition.toString());

        return this;
    }

    public override orderBy(field: (item: E) => any): this {
        throw new Error("Method not implemented.");
    }

    [Symbol.iterator](): Iterator<E, any, undefined> {
        throw new Error("Method not implemented.");
    }
}

/**
 * Collects the variable names from the function and adds them as an object key value pars at the end of the function
 * @param functionList 
 * @param input 
 * @returns 
 */
function processLambda(functionList: string[], input: string): string {
    return input.replace(/(\w+)\((.*?)\)/g, (match: string, func: string, args: string) => {
        // Check if the function is part of the query system.
        if (!functionList.includes(func)) return match;

        //Name of the query
        const [lambdaVar, expr] = args.split('=>').map(s => s.trim());

        // Remove all white spaces
        let exprNoSpace = expr.replace(/\s/g, '');

        // Split by operators
        let tokens = exprNoSpace.split(/(\|\||&&|==|!=|>=|<=|>|<|\+|-|\*|\/|!)/);

        // Create params by filtering tokens that don't start with lambda variable, but do start with a letter
        let params = tokens
            .filter(v => v !== func && !v.startsWith(lambdaVar + '.') && v !== lambdaVar && /^[a-zA-Z].*/.test(v))
            .reduce((obj, v) => ({ ...obj, [v]: v }), {});

        return `${func}(${args}, {${Object.entries(params).map(([k, v]) => `"${k}": ${v}`).join(', ')}})`;
    });
}

/**
 * Decorator to mark the functions that are containing queries.
 */
export function expression(value: Function, context: ClassMethodDecoratorContext) {
    return function(this: Entity){
        const input = value.toString();
        const functionList = ["where"];
        const result = processLambda(functionList, input);
        console.log(result);
        return eval("function " + result);
    }
}