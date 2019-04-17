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
    git clone $RemoteRepo $SourcesDirectory;
    Update-DevEnvWithLocalRepo -DatabaseName $DatabaseName;
}

function Update-LocalRepoWithDevEnv {
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

function Update-DevEnvWithLocalRepo {
    param(
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [ValidateSet("Force","Yes","No")]
        [string] $SynchronizeSchemaChanges = "Force"
    )
    Import-NAVApplicationObject -Path $SourcesDirectory"/*" -DatabaseName $DatabaseName -SynchronizeSchemaChanges $SynchronizeSchemaChanges -Confirm:$false;
    Compile-NAVApplicationObject -DatabaseName $DatabaseName;
}

function Update-LocalRepoWithRemoteRepo {
    param(
        [Parameter(Mandatory=$true)]
        [string] $RemoteRepo,
        [Parameter(Mandatory=$true)]
        [string] $SourcesDirectory = "./src"
    )
    $cwd = Get-Location;
    Set-Location $SourcesDirectory;
    git pull $RemoteRepo;
    git add .;
    Set-Location $cwd;
}

Export-ModuleMember -Function Show-Info;
Export-ModuleMember -Function Initialize-NavEnvironment;
Export-ModuleMember -Function Update-LocalRepoWithDevEnv;
Export-ModuleMember -Function Update-LocalRepoWithRemoteRepo;

