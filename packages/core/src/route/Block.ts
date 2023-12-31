import { Controller, Comperable, ChildResponse, Renderable, TemplateRenderEngine, Request, Response } from "../index.js";

/**
 * A Block is an interchangeble element on the view.
 */
export default class RouteBlock implements Comperable, Renderable{

    private templateName: string | null;
    private controller: Controller | null;
    /**
     * Creates a new block.
     * @param controller for the block
     * @param template to render the data.
     */
    constructor(controller: Controller | null,  template: string | null) {
        this.controller = controller;
        this.templateName = template;
    }

    public compare(other: this): boolean {
        return this.controller == other.controller && this.templateName == other.templateName;
    }

    public getTemplate(): string | null{
        return this.templateName;
    }

    public getController(): Controller | null{
        return this.controller;
    }

    public render(engine: TemplateRenderEngine, request: Request, response: Response){
        if(this.controller){
            let routedResponse = new ChildResponse(this.controller, response);
            routedResponse.setTemplateName(this.templateName);
            this.controller.render(engine, request, routedResponse);
        }else if(this.templateName){
            let template = engine.getTemplate(this.templateName);
            template?.render(engine, request, response);
        }
    }
}