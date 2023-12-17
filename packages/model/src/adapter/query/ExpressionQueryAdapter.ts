import { Driver } from "../../Driver.js";
import { Entity, Expression, InsertQuery } from "../../index.js";
import { NativeExpression } from "./NativeExpression.js";
import { QueryAdapter } from "./QueryAdapter.js";

export abstract class ExpressionQueryAdapter<NativeConnection> extends QueryAdapter<NativeConnection>{

    protected transformCondition(condition: Function, expression: Expression): NativeExpression{

    }
}