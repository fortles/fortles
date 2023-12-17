import { 
    OperatorExpression, Expression, AddOperatorExpression, AndOperatorExpression, DivideOperatorExpression, 
    EquialOperatorExpression, GreaterOperatorExpression, GreaterOrEquialOperatorExpression, LessOperatorExpression, 
    LessOrEquialOperatorExpression, MultiplyOperatorExpression, NotEquialOperatorExpression, OrOperatorExpression, 
    SubtractOperatorExpression, XorOperatorExpression, VariableExpression, LiteralExpression,
} from "../../index.js";

type OperatorTree = {[k: string]: {[k: string]: typeof Expression}};

type VariablesContext = {[k: string]: any};

/**
 * Expression Builder
 * 
 * Utility class to build a single expression for a lambda function.
 * After run this class will be destructed.
 */
export class ExpressionBuilder{

    /** Determines the precedence of each operator */
    protected operatorPrecedence: typeof OperatorExpression[][] = [
        [
            EquialOperatorExpression, 
            NotEquialOperatorExpression,
            GreaterOperatorExpression,
            LessOperatorExpression, 
            GreaterOrEquialOperatorExpression,
            LessOrEquialOperatorExpression
        ],
        [
            AndOperatorExpression,
            OrOperatorExpression,
            XorOperatorExpression
        ],
        [
            MultiplyOperatorExpression,
            DivideOperatorExpression
        ],
        [
            AddOperatorExpression,
            SubtractOperatorExpression
        ],
    ];

    /** Tree for the characters of an operator. Like if we have a + sign than the tree leaf can have + for =+ */
    protected operatorTree: OperatorTree;

    /** Probably the name of the query variable */
    protected variableName: string;

    /** Variables passed to the builder */
    protected variables: {[key: string]: any};

    /**
     * Creates a new expression builder
     * @param variableName Name of the function parameter holding the query
     * @param variables Variables and their values in the query
     */
    protected constructor(variableName: string, variables: {[key: string]: any}){
        this.variableName = variableName;
        this.variables = variables;
        this.operatorPrecedence = [];

        this.operatorTree = this.buildOperatorTree(this.operatorPrecedence.flat());
    }

    /**
     * Builds a new expression from an arrow function
     * @param arrowFunction Arrow function to process
     * @param variables Object containing the variables used in the lambda function.
     * @returns The expression
     */
    public static build(arrowFunction: Function, variables: VariablesContext): Expression{
        const {argument, code} = this.parseArrowFunction(arrowFunction.toString());
        const builder = new this(argument, variables);
        return builder.build(code);
    }

    /**
     * Splits the arrow function intu argument and code parts.
     * @param arrowFunction String representation of the arrow function.
     * @returns Argument and the code
     */
    protected static parseArrowFunction(arrowFunction: string){
        let parts = arrowFunction.split("=>");
        if(parts.length != 2){
            throw new Error("In ExpressionQueries only arrow functions are available.");
        }
        let argument = this.trimSpacesAndParentheses(parts[0]);
        let code = parts[1].replace(/^\s*(.+)\s*$/, "$1");
        return {argument, code};
    }

    /**
     * Build the operator tree for processing text, to operator types
     * for example + can be an operator and `+` with a leaf `=`
     * @param operators The flat list of awailable operators without ranking
     * @returns The operator tree
     */
    protected buildOperatorTree(operators: (typeof OperatorExpression)[]): OperatorTree{
        const operatorTree: any = {};
        for(const operator of operators){
            const sign = '?'; // operator.getSign();
            let operatorBranch = operatorTree;
            for(const c of sign){
                if(!operatorBranch[c]){
                    operatorBranch[c] = {};
                }
                operatorBranch = operatorBranch[c]
            }
            operatorBranch[""] = operator;
        }
        return operatorTree;
    }

    /**
     * Builds the expression
     * @param expressionText A lambda expression
     * @returns The expression
     */
    public build(expressionText: string): Expression{
        expressionText = ExpressionBuilder.trimSpacesAndParentheses(expressionText);
        // We can process recursively one operator, the highest precedence one at a time.
        const highestOperator = this.buildHighestPrecedneceOperator(expressionText);
        if(highestOperator){
            return highestOperator;
        }
        //TODO: Functional operators

        //Identifier expression
        const identifierExpression = this.buildVariableExpression(expressionText);

        if(identifierExpression){
            return identifierExpression;
        }

        return new LiteralExpression(expressionText);
    }

    /**
     * Builds the highest precedence operator
     * 
     * Recursively does this as each expression can be separated into two parts except if we have a functional operator.  
     * For example:     
     * `a || b == c.includes("a")`  
     * Here the highest precedence on will be `==` this separates the expression into two parts.
     * In the `a || b` part we can run this function again. in the `c.includes("a")` part is a functional one 
     * so it will be interpreted as is.
     * 
     * @param expressionText 
     * @returns 
     */
    protected buildHighestPrecedneceOperator(expressionText: string): OperatorExpression|null{
        let operatorBranch: any= null;
        let isFound = false;
        let stringCharacter: null|string = null;
        let isEscape = false;
        let operatorType: (typeof OperatorExpression & (new() => OperatorExpression))|null = null;
        let highestOperatorType: (typeof OperatorExpression & (new() => OperatorExpression))|null = null;
        let bracketCount = 0;
        for(const c of expressionText){
            if(c == '"' || c == '"' && !stringCharacter){
                stringCharacter = c;
            }
            if(stringCharacter && c == "\\"){
                isEscape = true;
            }
            if(stringCharacter){
                if(isEscape){
                    isEscape = false;
                }else if(c == stringCharacter){
                    stringCharacter = null;
                }
                continue;
            }
            if(c == "("){
                bracketCount++;
            }
            if(c == ")"){
                bracketCount--;
            }
            //Skip if brackets are found. external cant be becouse of trim, 
            //and inside bracket there should not be higher level operand.
            if(bracketCount > 0){
                continue;
            }
            if(isFound){
                if(operatorBranch[c]){
                    operatorType = operatorBranch[c];
                }else{
                    operatorType = operatorBranch[""]
                }
            }else{
                if(this.operatorTree[c]){
                    operatorBranch = this.operatorTree[c];
                    isFound = true;
                }
            }
            if(operatorType){
                if(!highestOperatorType || this.getOperatorPrecedence(operatorType) > this.getOperatorPrecedence(highestOperatorType))
                highestOperatorType = operatorType;
                operatorType = null;
            }
        }
        if(highestOperatorType){
            //@ts-ignore
            return new highestOperatorType();
        }else{
            return null;
        }
    }

    /**
     * Builds a variable expression
     * @param expressionText The lambda text
     * @returns The expression or null if the variable not found.
     */
    protected buildVariableExpression(expressionText: string): VariableExpression|null{
        if(expressionText in Object.keys(this.variables)){
            return new VariableExpression(expressionText);
        }
        return null;
    }

    /**
     * Removes all unnecessary white space characters, and extra pharentesises.
     * @param input The imput text to rmove form
     * @returns The cleaned text
     */
    public static trimSpacesAndParentheses(input: string): string {
        let trimmed = input.trim();
        let match;
      
        while ((match = trimmed.match(/^\((.*)\)$/))) {
            const inner = match[1];
            const openCount = (inner.match(/\(/g) || []).length;
            const closeCount = (inner.match(/\)/g) || []).length;
        
            if (openCount === closeCount) {
                trimmed = inner;
            } else {
                break;
            }
        }
      
        return trimmed;
    }
    
    /**
     * Returns the precedence of the selected operator
     * @param operator The operator
     * @returns Precendence where 0 is the first.
     */
    protected getOperatorPrecedence(operator: typeof OperatorExpression): number{
        for(let rank = 0; rank < this.operatorPrecedence.length; rank++){
            if(this.operatorPrecedence[rank].includes(operator)){
                return rank;
            }
        }
        return Infinity;
    }
}