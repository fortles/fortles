import {
    Shard, 
    WriteableShard, 
    EvalWriteableShard, 
    BlockControlShard, 
    Template, 
    AnchorControlShard, 
    ButtonControlShard,
    IfControlShard, 
    InputControlShard,
    FormatControlShard,
    ControlShardCursorPosition,
    Request, 
    Response, 
    Application,
    CharacterStreamReader,
    RenderEngine,
    ControlShard
} from "../index.js";

export const enum TemplateShardStates{
    TEXT,
    EVAL_START,
    EVAL,
    CONTROL_START,
    CONTROL,
    CONTROL_STOP_START,
    CONTROL_STOP,
    LOCALIZATION_START,
    LOCALIZATION,
    LOCALIZATION_END,
}

export default class TemplateShard implements Shard{
    
	protected parent: TemplateShard|null;
	protected shardName: string|null = null;
    protected shards: Shard[] = [];
    protected namespace = 'f';

    constructor(parent: TemplateShard|null){
        this.parent = parent;
        this.shards = [];
    }

    prepare(reader: CharacterStreamReader): void {
        let shard = new WriteableShard();
        let state = TemplateShardStates.TEXT;
        let evalBraclet = 1;
        let c: string|null;
        while ((c = reader.read()) !== null) {
            switch (state) {
                case TemplateShardStates.TEXT:
                    switch (c) {
                        case '$':
                            state = TemplateShardStates.EVAL_START;
                            break;
                        case '<':
                            state = TemplateShardStates.CONTROL_START;
                            break;
                        case '_':
                            state = TemplateShardStates.LOCALIZATION_START;
                            break;
                        default:
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.EVAL_START:
                    switch (c) {
                        case '{':
                            this.append(shard);
                            state = TemplateShardStates.EVAL;
                            shard = new EvalWriteableShard(reader.getCursorPath());
                            evalBraclet = 1;
                            break;
                        case '\\': //Escape the template literal
                            state = TemplateShardStates.TEXT;
                            shard.write('$');
                            break;
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('$');
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.EVAL:
                    switch (c) {
                        case '{':
                            evalBraclet++;
                            shard.write(c);
                            break;
                        case '}':
                            evalBraclet--;
                            if(!evalBraclet){
                                this.append(shard);
                                shard = new WriteableShard();
                                state = TemplateShardStates.TEXT;
                            }else{
                                shard.write(c);
                            }
                            break;
                        default:
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.CONTROL_START:
                    switch (c) {
                        case this.namespace:
                            state = TemplateShardStates.CONTROL;
                            break;
                        case '/':
                            if (this.shardName != null) {
                                state = TemplateShardStates.CONTROL_STOP_START;
                                break;
                            }//Falling to default if shardName is not set.
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('<');
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.CONTROL:
                    switch (c) {
                        case ':':
                            this.append(shard);
                            this.prepareControl(reader);
                            state = TemplateShardStates.TEXT;
                            shard = new WriteableShard();
                            break;
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('<');
                            shard.write(this.namespace);
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.CONTROL_STOP_START:
                    switch (c) {
                        case this.namespace:
                            state = TemplateShardStates.CONTROL_STOP;
                            break;
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('<');
                            shard.write('/');
                            shard.write(c);
                            break;
                    }
                    ;
                    break;
                case TemplateShardStates.CONTROL_STOP:
                    switch (c) {
                        case ':':
                            if (this.end(reader, shard)) {
                                this.append(shard);
                                return;
                            }
                            break;
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('<');
                            shard.write('/');
                            shard.write(this.namespace);
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.LOCALIZATION_START:
                    switch (c) {
                        case '"':
                            this.append(shard);
                            state = TemplateShardStates.LOCALIZATION;
                            shard = new /*TODO: Localization*/WriteableShard();
                            break;
                        default:
                            state = TemplateShardStates.TEXT;
                            shard.write('_');
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.LOCALIZATION:
                    switch (c) {
                        case '"':
                            state = TemplateShardStates.LOCALIZATION_END;
                            break;
                        default:
                            shard.write(c);
                            break;
                    }
                    break;
                case TemplateShardStates.LOCALIZATION_END:
                    switch (c) {
                        case '_':
                            this.append(shard);
                            shard = new WriteableShard();
                            state = TemplateShardStates.TEXT;
                            break;
                        default:
                            state = TemplateShardStates.LOCALIZATION;
                            shard.write('"');
                            shard.write(c);
                            break;
                    }
                    break;
            }
        }
        this.append(shard);
    }

    append(shard: WriteableShard): void{
        shard.ready();
        if(!shard.isEmpty()){
            this.shards.push(shard);
        }
    }

    createControlShard(name: string, reader: CharacterStreamReader, cursorPosition: ControlShardCursorPosition): Shard{
        let shard: ControlShard;
        switch (name) {
            case "block":
                shard = new BlockControlShard(reader, this, cursorPosition);
                break;
            /*case "for":
                return new ForControlShard(reader, this);
            case "form":
                return new FormControlShard(reader, this);*/
            case "a":
                shard = new AnchorControlShard(reader, this, cursorPosition);
                break;
            case "button":
                shard = new ButtonControlShard(reader, this, cursorPosition);
                break;
            case "if":
                shard = new IfControlShard(reader, this, cursorPosition);
                break;
            case "input":
                shard = new InputControlShard(reader, this, cursorPosition);
                break;
            case "f":
                shard = new FormatControlShard(reader, this, cursorPosition);
                break;
            default:
                throw new Error("There is no 'TemplateShard' definiton for '" + name + "'");
        }
        shard.initialize(reader);
        return shard;
        
    }

    prepareControl(reader: CharacterStreamReader): void{
        let c: string|null;
        let controlName = '';
        let cursorPosition: ControlShardCursorPosition = ControlShardCursorPosition.ENDED;
        parser:
        while ((c = reader.read()) !== null) {
            switch(c){
                case '/':
                    cursorPosition = ControlShardCursorPosition.ENDED;
                    continue;
                case '>':
                    if(!cursorPosition){
                        cursorPosition = ControlShardCursorPosition.INSIDE;
                    }
                    break parser;
                case ' ':
                    cursorPosition = ControlShardCursorPosition.ATTRIBUTES;
                    break parser;
            }
            controlName += c;
        }
        let shard = this.createControlShard(controlName, reader, cursorPosition);
        this.shards.push(shard);
    }

    /**
     * Checks wether the current statmenet ended. Overwrite, if something must
     * be added after the shard ending.
     *
     * @param reader The input stream, dont touch it.
     * @param shard The current shard, you can touch it.
     * @return Returns true if the shard is ended.
     */
     end(reader: CharacterStreamReader, shard: WriteableShard): boolean {
        if(this.shardName){
            for (let i=0; i < (this.shardName.length); i++) {
                let c = reader.read();
                if (c === null || this.shardName[i] !== c) {
                    shard.write(this.shardName.substring(0, i));
                    return false;
                }
            }
        }
        let c = reader.read();
        //If we have the closing tag return true, the current block is ended
        return c == '>';
    }

    /**
     * Renders all the embedded shards
     * @param engine 
     * @param request 
     * @param response 
     */
    render(engine: RenderEngine, request: Request, response: Response): void{
        for(let shard of this.shards){
            shard.render(engine, request, response);
        }
    }

    public getParent(): TemplateShard|null {
        return this.parent;
    }

    public getTemplate(): Template|null {
        let shard: TemplateShard|null = this;
        while (shard?.getParent() != null) {
            shard = shard.getParent();
        }
        if (shard instanceof Template) {
            return shard;
        } else {
            return null;
        }
    }

    /**
     * Gets the name of the whole Template.
     *
     * @return Name of the template
     */
    public getTemplateName(): string|null {
        let template = this.getTemplate();
        if (template != null) {
            return template.getName();
        } else {
            return null;
        }
    }
    
    public getApplication(): Application|null{
        let template = this.getTemplate();
        if (template != null) {
            return template.getApplication();
        } else {
            return null;
        }
    }

    /**
     * Gets the children shards.
     * @returns Array of the Shards.
     */
    public getShards(): Shard[]{
        return this.shards;
    }
}