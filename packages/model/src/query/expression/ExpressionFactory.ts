import { Expression } from "./Expression.js";
import { ExpressionVaribleContext } from "./ExpressionVariableContext.js";

export class ExpressionFactory{

    /** Cache to allow expressions  */
    protected cache = new Map<string, Expression>();

    public get(arrowFunction: Function, variables: ExpressionVaribleContext): Expression{
        const stringRepresentation = arrowFunction.toString();
        let expression = this.cache.get(stringRepresentation);

        if(!expression){
            expression = new Expression("sdf");
        }

        return expression;
    }
}