import { Environment, EnvironmentType } from "./interfaces/environment";

export function getDefaultNavModelToolsPath() {
    return "C:\\Program Files (x86)\\Microsoft Dynamics 365 Business Central\\130\\RoleTailored Client\\NavModelTools.ps1";
}
export function getDefaultNavAdminToolPath() {
    return "C:\\Program Files\\Microsoft Dynamics 365 Business Central\\130\\Service\\NavAdminTool.ps1";
}
export function getDefaultNavDatabaseName() {
    return "Demo Database NAV (13-0)";
}
export function getDefaultUidOffset() {
    return 52063045;
}
export function createDefaultEnvironment() {
    return createDefaultLocalEnvironment();
}

export function createDefaultLocalEnvironment() {
    return {
        type: EnvironmentType.local,
        database: {
            databaseName: getDefaultNavDatabaseName(),
            // Feature not implemented yet
            // uidOffset: getDefaultUidOffset()
        },
        repository: {
            remoteRepository: "/path/to/remote/repository",
            localSourcesDirectory: "./src"
        },
        navModules: {
            navModelToolsPath: getDefaultNavModelToolsPath(),
            navAdminToolPath: getDefaultNavAdminToolPath()
        }
    } as Environment;
}

export function createDefaultContainerEnvironment() {
    return {
        type: EnvironmentType.container,
        container: {
            name: "BCSandbox",
            serverInstance: "NAV",
            exportObjectsToNewSyntax: true
        },
        database: {
            databaseName: getDefaultNavDatabaseName(),
            // Feature not implemented yet
            // uidOffset: getDefaultUidOffset()
        },
        repository: {
            remoteRepository: "/path/to/remote/repository",
            localSourcesDirectory: "./src"
        }
    } as Environment;
}
