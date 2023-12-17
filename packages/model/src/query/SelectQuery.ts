import { Driver, Entity } from "../index.js";
import { Query } from "./Query.js";

export class SelectQuery<E extends Entity, D extends Driver<any> = Driver<any>> extends Query<E, D>{

}