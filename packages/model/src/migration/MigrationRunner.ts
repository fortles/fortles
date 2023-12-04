import { readdir } from "fs/promises";
import { existsSync } from "fs";
import { Connection, Model, ModelDescriptor, Migration, EntityDescriptor, CreateSchemaChange, SchemaChange} from "../index.js";
import DatabseVersion from "./model/DatabaseVersion.js";

/**
 * Facility for running migrations and snapshots
 * 
 * Migrations can be created, executed from here. Also snaphots can be created for detecting new changes.
 * A migration usually have the following states.
 * - **migration initial, first, etc...:** The previous migrations what are already applied on the database.
 * - **baseline.snapshot:** Version where the current development session started.
 * - **current.snapshot:** Current version of the database.
 * 
 * A workflow here is to make changes on the models. 
 * Changes will applied to the current snapshot, than the current snapshot
 * will be updated. When the developer initaite a new migration creation 
 * the base.snapshot and current.snapshot will be compared, 
 * and the difference will be saved to the disk as a new migration.
 */
export class MigrationRunner{

    /** Model to run the migrations on */
    protected model: Model;

    /** The current snapshot, changes can be calculated since this one. */
    protected modelDescriptorSnapshot: ModelDescriptor|null = null;

    /** Where the migrations are stored. Each connection will have a subfolder here. */
    protected basePath: string = "./migartion";

    /** Contains the version for each connection */
    protected databaseVersionMap = new Map<string, DatabseVersion>;

    /**
     * Creates a new model.
     * @param model Model to run the migrations on
     */
    constructor(model: Model){
        this.model = model;
    }

    /**
     * Runs the migrations for all connections.
     * Only migration files will be executed, the snapshot, or alteration from the snapshots are not.
     * @see migrateConnectionFromSnapshot
     * @see updateSnapshotAndMigrateConnection
     * @returns Number of migrations that executed
     */
    async migrate(): Promise<number>{
        const promises = Array.from(this.model.getAllGlobalConnections()).map(x => this.migrateConnection(x, true));
        return (await Promise.all(promises)).reduce((a, x) => a + x, 0);
    }

    /**
     * Checks if there is any migration that is not executed.
     * Changes should not be applied if there is any dirty data.
     */
    async isDirty(): Promise<boolean>{
        const promises = Array.from(this.model.getAllGlobalConnections()).map(x => this.migrateConnection(x, true));
        const changes = (await Promise.all(promises)).reduce((a, x) => a + x, 0);
        return changes > 0;
    }

    /**
     * Runs the migartions against all the databases in the connection list.
     * @param paths Array of paths
     * @returns Migrations applied
     */
    async migrateConnection(connection: Connection, dryRun: boolean = false): Promise<number>{
        //Get database version
        let databaseVersion = new DatabseVersion();
        let migrationsApplied = 0;
        try{
            databaseVersion = connection.query(DatabseVersion).first() ?? new DatabseVersion();
        }catch(error){
            //TODO check error
            //If there is no database version for this connection, add to the database.
            const entityDescriptor = EntityDescriptor.create(DatabseVersion, this.model.getModelDescriptor());
            const createSchemaChange = CreateSchemaChange.createFromEntityDescriptor(entityDescriptor);
            createSchemaChange.applyTo(connection);
        }
        //Upgrade database to the latest version
        //TODO: get folders from the model!
        for(const folder of this.model.getModelDescriptor().getSources()){
            for(const file of await readdir(folder)){
                if(databaseVersion && databaseVersion.version && file.startsWith(databaseVersion.version)){
                    //Skip to the current version
                    continue;
                }
                const migration = await import(file) as Migration;
                //Run migration
                if(!dryRun){
                    migration.applyTo(connection);
                }
                migrationsApplied++;
            }
        }
        return migrationsApplied;
    }

    /**
     * Migrate connection to match the snapshot version.
     * @param snapshot The snapshot
     */
    public async migrateConnectionFromSnapshot(snapshot: ModelDescriptor): Promise<void>{

        const changesMap = this.model.getModelDescriptor().getChanges(snapshot);

        // Create an array to hold promises for each connection's processing
        const connectionPromises = [];

        // Iterate over each connection and create a promise for its processing
        for (const [connectionName, changes] of changesMap.entries()) {
            const connectionPromise = this.processConnectionChanges(connectionName, changes);
            connectionPromises.push(connectionPromise);
        }

        // Wait for all connections to finish processing
        await Promise.all(connectionPromises);
    }

    /**
     * Process all changes for a specific connection in sequence
     */
    private async processConnectionChanges(connectionName: string, changes: SchemaChange[]): Promise<void> {
        const connection = Model.getConnection(connectionName);
        for (const change of changes) {
            await change.applyTo(connection);
        }
    }

    /**
     * Migrate connection to match the snapshot version.
     * @param name Name of the snapshot
     */
    public async migrateConnectionFromSnapshotFile(name: string = "latest.snapshot"): Promise<void>{
        //Detect changes from the last snapshot
        const path = this.basePath + "/" + name;

        let snapshot = await this.loadSnapshot(path);

        //If the snapshot does not exists we assume an empty database here.
        if(!snapshot){
            snapshot = new ModelDescriptor();
        }

        return this.migrateConnectionFromSnapshot(snapshot);
    }

    /**
     * Saves snapshot from the current model descriptor.
     * @param path Save the snapshot to this location.
     */
    public async saveSnapshot(path: string): Promise<void>{
        this.modelDescriptorSnapshot = this.model.getModelDescriptor().clone();
        ModelDescriptor.serialize(this.modelDescriptorSnapshot, path);
    }

    /**
     * Loads a snapshot from a file
     * @param path Path to the snapshot
     * @returns The snapshot, or null if not exists
     */
    public async loadSnapshot(path: string): Promise<ModelDescriptor|null>{
        if(existsSync(path)){
            return ModelDescriptor.deserialize(path);
        }else{
            return null;
        }
    }

    /**
     * Creates a baseline snapshot.
     * 
     * This is the database version after the latest migration, with other words the latest version
     * before any additional changes are added to the database. If the database not updated to the latest
     * version or `applyMigrations` are not set, this will fail.
     * 
     * @param applyMigrations If migrations should be applied anyways, dirty check can be skipped.
     * @throws When not all the migrations are applied, and applyMigrations are not set.
     */
    public async createBaseSnapshot(applyMigrations: boolean = false): Promise<void>{
        if(applyMigrations){
            await this.migrate();
        }if(await this.isDirty()){
            throw new Error("You have migrations that are not applied!");
        }
        ModelDescriptor.serialize(this.model.getModelDescriptor(), this.basePath + "/baseline.snapshot");
    }

    /**
     * Creates a migration from the changes since the baseline snapshot.
     * @param name Name of the migration.
     * @returns An empty promise
     */
    public async saveMigrationFromSnapshot(name: string): Promise<void>{
        const baseSnapshot = await this.loadSnapshot(this.basePath + "/.baseline.snapshot");
        if(!this.modelDescriptorSnapshot || !baseSnapshot){
            return;
        }
        const changesMap = baseSnapshot.getChanges(this.modelDescriptorSnapshot);
        for(const [connectionName, changes] of changesMap){
            const migartion = new Migration(changes);
            const version = this.databaseVersionMap.get(connectionName)?.version ?? 1;
            migartion.save(this.basePath + "/" + connectionName + "/" + version + "_" + name, name);
            //TODO: Save version to the database.
        }
    }

    /**
     * Updates the snapshot and the connection as well.
     * @param name Name of the snapshot.
     */
    public async updateSnapshotAndMigrateConnection(name: string = "latest.snapshot"){
        await this.migrateConnectionFromSnapshotFile(name);
        await this.saveSnapshot(name);
    } 
}