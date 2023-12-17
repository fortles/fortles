import { Expression } from "../../index.js";

export class NativeExpression<N>{
    callable: Function;
    expression: Expression;
    native: N;

    constructor(callable: Function, expression: Expression, native: N){
        this.callable = callable;
        this.expression = expression;
        this.native = native;
    }
}