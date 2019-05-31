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
    Export-NAVApplicationObject -DatabaseName $DatabaseName -Filter $Filter -Path $tempExportFilePath -Force -Confirm:$false | Out-Null;
    Set-NAVApplicationObjectProperty -TargetPath $tempExportFilePath -ModifiedProperty "No" -DateTimeProperty "";
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
        $tempImportDirectory = './temp';
        $tempFile = -join([guid]::NewGuid(), ".txt");
        $tempImportFilePath = Join-Path -Path $tempImportDirectory -ChildPath $tempFile;
        if (-Not(Test-Path -Path $tempImportDirectory)) {
            New-Item -Path $tempImportDirectory -ItemType Directory | Out-Null;
        }
        Write-Host "Importing objects from "$SourcesDirectory;
        Join-NAVApplicationObjectFile -Source $SourcesDirectory"/*" -Destination $tempImportFilePath;
        Set-NAVApplicationObjectProperty -TargetPath $tempImportFilePath -ModifiedProperty "No" -DateTimeProperty "";        
        Import-NAVApplicationObject -Path $tempImportFilePath -DatabaseName $DatabaseName -SynchronizeSchemaChanges $SynchronizeSchemaChanges -Confirm:$false;
        Remove-Item -Path $tempImportDirectory -Recurse -Force -ErrorAction Ignore;
        Write-Host "Compiling imported objects";
        Compile-NAVApplicationObject -DatabaseName $DatabaseName -SynchronizeSchemaChanges $SynchronizeSchemaChanges;
    }
    else {
        Write-Error "The remote repository has not been cloned properly. Make sure that the remote uri is valid and you have permissions to access the files";
    }
}

Export-ModuleMember -Function Update-LocalRepoWithLocalDev;
Export-ModuleMember -Function Update-LocalDevWithLocalRepo;
