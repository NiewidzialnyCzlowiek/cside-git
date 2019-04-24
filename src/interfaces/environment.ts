export interface Environment {
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