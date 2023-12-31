import * as http from "http";
import {Request, RequestType, Locale, Application} from "@fortles/core";

export default class ServerRequest extends Request{

	protected httpRequest: http.IncomingMessage;

    constructor(request: http.IncomingMessage){
        super();
        this.httpRequest = request;
    }

    public getType(): RequestType {
        if(this.httpRequest.method != "GET"){
            return RequestType.ACTION;
        }
        if(this.httpRequest.headers["fortles-source"] !== undefined){
            return RequestType.PARTIAL;
        }
        if(this.httpRequest.headers["fortles-target"] !== undefined){
            return RequestType.BLOCK;
        }
        return RequestType.FULL;
    }

    public getMime(): string {
        return this.httpRequest.headers["content-type"] || "text/html";
    }

    public getPath(): string|null {
        return this.httpRequest.url ?? null;
    }

    public getLocale(): Locale|null{
        let locale: Locale|null = null;
        const path = this.httpRequest.url
        if(!path){
            return null;
        }
        if(path.charAt(3) == "/"){
            locale =  new Locale(path.substring(0,2));
        }
        else if(path.charAt(3) == "-" && path.charAt(5) == "/"){
            locale = new Locale(path.substring(0,2), path.substring(3,5));
        }else{
            //Check the header if the url is not present.
            let header = this.httpRequest.headers["accept-language"] ?? "";
            let pos = header.indexOf(",");
            header = pos == -1 ? header : header.substring(0, pos);
            let dash = header.indexOf("-");
        }
        return locale;
    }

    public getClosestLocale(): Locale|null{
        let header = this.httpRequest.headers["accept-language"] ?? "";
        let matches = header.matchAll(/([a-z]{2}|\*);q=(0.\d+)/);
        for(const match of matches){
            let locale = Application.getLocale(match[1]);
            if(locale){
                return locale;
            }
        }
        return Application.getDefaultLocale();
    }

    getReferer(): string|null {
        return this.httpRequest.headers.referer ?? null;
    }
    
    getBlockPath(): string {
        return this.httpRequest.headers["fortles-source"] as string 
            || this.httpRequest.headers["fortles-target"] as string 
            || "";
    }

    public getOriginal(): http.IncomingMessage{
        return this.httpRequest;
    }
    
    public clone(): this{
        return this;
    }
}