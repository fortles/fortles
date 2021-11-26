import { Application, Middleware } from "@core";

export default abstract class Addon{
    public getMiddlewares(): Middleware[]{
        return [];
    }
    public abstract prepare(application: Application): void;
}