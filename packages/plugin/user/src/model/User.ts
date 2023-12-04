import { Entity, uuid, generated, primaryKey, email, hasMany, belongsToMany, model } from "@fortles/model";
import Group from "./Group.js";

@model
export default class User extends Entity{
    @primaryKey
    @generated
    @uuid()
    id?: Readonly<string>;

    @email()
    email?: string;

    @belongsToMany(() => Group)
    groups?: Group[];
}