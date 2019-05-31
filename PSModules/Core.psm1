function New-NavEnvironment {
    param(
        [Parameter(Mandatory=$true)]
        [string] $RemoteRepo,
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src"
    )
    $RemoteRepoDirectory = "$($RemoteRepo).git";
    git init --bare $RemoteRepoDirectory;
    if (Test-Path -Path $SourcesDirectory) {
        Remove-Item $SourcesDirectory -Recurse -Force;
    }
    git clone $RemoteRepo $SourcesDirectory;
    $objectTypes = "Table","Page","Query","Report","XMLport","MenuSuite";
    foreach ($objectType in $objectTypes) {
        $Filter = "Type=$($objectType)";
        Update-LocalRepoWithLocalDev -DatabaseName $DatabaseName -SourcesDirectory $SourcesDirectory -Filter $Filter;
        Invoke-CommandInDirectory -Directory $SourcesDirectory -ScriptBlock {
            git add .;
            git commit -m "Add all objects of type $($objectType)";
        }
    }
}

function Initialize-NavEnvironment {
    param(
        [Parameter(Mandatory=$true)]
        [string] $RemoteRepo,
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [Parameter(Mandatory=$true)]
        [bool] $Local,
        [string] $ContainerName,
        [string] $SourcesDirectory = "./src",
        [ValidateSet("Force","Yes","No")]
        [string] $SynchronizeSchemaChanges = "Force"
    )
    if (-Not(Test-Path -Path $SourcesDirectory"/*")) {
        git clone $RemoteRepo $SourcesDirectory;
        if ($local) {
            Update-LocalDevWithLocalRepo -DatabaseName $DatabaseName -SourcesDirectory $SourcesDirectory;
        }
        else {
            Update-ContainerDevWithLocalRepo -ContainerName $ContainerName -DatabaseName $DatabaseName -SourcesDirectory $SourcesDirectory;
        }
        Write-Host "Local Development Environment initialized. Happy coding ;)";
    }
    else {
        Write-Host "Local Development Environemnt already initialized. Please use one of update commands.";
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

Export-ModuleMember -Function New-NavEnvironment;
Export-ModuleMember -Function Initialize-NavEnvironment;
Export-ModuleMember -Function Update-LocalRepoWithRemoteRepo;
Export-ModuleMember -Function Update-RemoteRepoWithLocalRepo;
