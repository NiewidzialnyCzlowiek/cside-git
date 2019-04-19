function Show-Info () {
    Write-Host "Welcome to IT.integro GIT extension";
    Write-Host "This is a tool designed to make source control for Dynamics NAV development easier";
}

function Initialize-NavEnvironment {
    param(
        [Parameter(Mandatory=$true)]
        [string] $RemoteRepo,
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [ValidateSet("Force","Yes","No")]
        [string] $SynchronizeSchemaChanges = "Force"
    )
    if (-Not(Test-Path -Path $SourcesDirectory"/*")) {
        git clone $RemoteRepo $SourcesDirectory;
        Update-LocalDevWithLocalRepo -DatabaseName $DatabaseName;
        Write-Host "Local Development Environment initialized. Happy coding ;)";
    }
    else {
        Write-Host "Local Development Environemnt already initialized. Updating local development environment.";
        Update-LocalRepoWithRemoteRepo;
        Update-LocalDevWithLocalRepo -DatabaseName $DatabaseName;
    }
}

function Update-LocalRepoWithLocalDev {
    param(
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [string] $Filter = 'Modified=Yes'
    )
    $tempExportDirectory = './temp';
    $tempFile = -join([guid]::NewGuid(), ".txt");
    $tempExportFilePath = Join-Path -Path $tempExportDirectory -ChildPath $tempFile;
    if (-Not(Test-Path -Path $tempExportDirectory)) {
        New-Item -Path $tempExportDirectory -ItemType Directory | Out-Null;
    }
    Export-NAVApplicationObject -DatabaseName $DatabaseName -Filter $Filter -Path $tempExportFilePath -Force -Confirm:$false | Out-Null
    if(Test-Path -Path $tempExportFilePath) {
        Split-NAVApplicationObjectFile -Source $tempExportFilePath -Destination $SourcesDirectory -Force -Confirm:$false;
    }
    Remove-Item -Path $tempExportDirectory -Recurse -Force -ErrorAction Ignore;
}

function Update-LocalDevWithLocalRepo {
    param(
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [ValidateSet("Force","Yes","No")]
        [string] $SynchronizeSchemaChanges = "Force"
    )
    if (Test-Path -Path $SourcesDirectory"/*") {
        Write-Host "Importing objects from "$SourcesDirectory;
        Import-NAVApplicationObject -Path $SourcesDirectory"/*" -DatabaseName $DatabaseName -SynchronizeSchemaChanges $SynchronizeSchemaChanges -Confirm:$false;
        Write-Host "Compiling imported objects";
        Compile-NAVApplicationObject -DatabaseName $DatabaseName;
    }
    else {
        Write-Error "The remote repository has not been cloned properly. Make sure that the remote uri is valid and you have permissions to access the files";
    }
}

function Update-LocalRepoWithRemoteRepo {
    param(
        [string] $SourcesDirectory = "./src"
    )
    $cwd = Get-Location;
    Set-Location $SourcesDirectory;
    git pull;
    git add .;
    Set-Location $cwd;
}

function Update-RemoteRepoWithLocalRepo {
    param(
        [string] $SourcesDirectory = "./src"
    )
    $cwd = Get-Location;
    Set-Location $SourcesDirectory;
    git push;
    Set-Location $cwd;
}

Export-ModuleMember -Function Show-Info;
Export-ModuleMember -Function Initialize-NavEnvironment;
Export-ModuleMember -Function Update-LocalRepoWithLocalDev;
Export-ModuleMember -Function Update-LocalDevWithLocalRepo;
Export-ModuleMember -Function Update-LocalRepoWithRemoteRepo;
Export-ModuleMember -Function Update-RemoteRepoWithLocalRepo;
