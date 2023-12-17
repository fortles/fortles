import { Driver, Entity } from "../index.js";
import { Query } from "./Query.js";

export class UpdateQuery<E extends Entity, D extends Driver<any> = Driver<any>> extends Query<E, D>{

}