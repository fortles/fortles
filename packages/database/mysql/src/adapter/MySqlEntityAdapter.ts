import { Entity, EntityAdapter } from "@fortles/model";
import { MySqlDriver } from "../MySqlDriver.js";

export class MySqlEntityAdatper extends EntityAdapter{

    importEntity(data: object): Entity {
        throw new Error("Method not implemented.");
    }

    exportEntity(entity: Entity): object {
        throw new Error("Method not implemented.");
    }

    exportCreateDefinition(): string {
        let definition = "CREATE TABLE `" + "` (";

        definition += ");";
        return definition;
    }

    exportDropDefinition(): string {
        throw new Error("Method not implemented.");
    }

    exportAlterDefinition(old: this): string {
        throw new Error("Method not implemented.");
    }

}