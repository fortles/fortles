import { Addon, Application, AssetService, DefaultServiceContainer, Request, Response, ScriptAsset, ServiceContainer } from "@fortles/core";
import { ServerRequest, ServerResponse } from "@fortles/platform.server";
import * as http from "http";

export default class EventSourceService extends ServiceContainer<DefaultServiceContainer> implements Addon {
    
    protected clients: http.ServerResponse[] = [];

    public override async prepare(application: Application): Promise<void> {
        this.listenOnFullPath("event-source");
        if(!import.meta.resolve){
            throw Error("import.meta.resolve not enabled.");
        }
        let asset = new ScriptAsset(await import.meta.resolve("../asset/event-source.js"));
        application.getService(AssetService).add(asset);
    }

    public override onRequest(request: Request, response: Response, path: string, partialPath: string): void {
        if(response instanceof ServerResponse && request instanceof ServerRequest){
            let originalResponse = response.getOriginal();
            //Create event stream
            originalResponse.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            });
            this.clients.push(originalResponse);
            request.getOriginal().on('close', () => {
                this.clients = this.clients.filter(x => x === originalResponse);
            });
        }
    }

    public send(event: string, message: string = ""){
        for(const client of this.clients){
            client.write("event:" + event + "\ndata:" + message.replace("\n","\\n") + "\n\n");
        }
    }

    public dropClients(){
        for(const client of this.clients){
            client.end();
        }
    }
}