import { Entity, primaryKey, generated, uuid, email, belongsToMany, string, model } from "../../src/index.js";
import { TestGroup } from "./index.js";

/**
 * Test users goal is to simulate all possible connection types.
 */
@model
export class TestUser extends Entity{
    //Redefining the primaray key with an auto generated uuid
    @primaryKey
    @generated
    @uuid()
    readonly id?: Readonly<string>;

    @email()
    email?: string;

    @belongsToMany(() => TestGroup)
    groups?: TestGroup[];

    @string()
    name?: string;
}