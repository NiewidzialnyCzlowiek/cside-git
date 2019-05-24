export interface Environment {
    type: EnvironmentType;
    container: {
        name: string;
        serverInstance: string;
    }
    database: {
        databaseName: string;
        // Feature not implemented yet
        // uidOffset: number;
    };
    repository: {
        remoteRepository: string,
        localSourcesDirectory: string
    };
    navModules: {
        navModelToolsPath: string,
        navAdminToolPath: string
    };
}

export enum EnvironmentType {
    local = "Local",
    container = "Container"
}
