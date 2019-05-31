function Copy-ArchiveFromContainerThenExpandAndDelete {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName,
        [Parameter(Mandatory=$true)]
        [string] $ContainerPath,
        [Parameter(Mandatory=$true)]
        [string] $LocalPath,
        [Parameter(Mandatory=$true)]
        [string] $ArchiveName
    )
    $containerArchivePath = Join-Path $ContainerPath $ArchiveName;
    $containerPart = [string]::Join(":", @($ContainerName, $containerArchivePath));
    $destinationPath = Join-Path $SourcesDirectory $ArchiveName;
    docker cp $containerPart $destinationPath;
    Expand-Archive -Path $destinationPath -DestinationPath $SourcesDirectory -Force;
    Remove-Item -Path $destinationPath -Force -ErrorAction Ignore;
}

function Get-ContainerTempPath {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName
    )
    $containerTempPath = Invoke-CommandInWindowsContainer -ContainerName $ContainerName -ScriptBlock {
        return $env:TEMP;
    }
    return $containerTempPath;
}

function Compress-ArchiveThenCopyToContainerAndDelete {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName,
        [Parameter(Mandatory=$true)]
        [string] $ContainerPath,
        [Parameter(Mandatory=$true)]
        [string] $SourcesDirectory,
        [Parameter(Mandatory=$true)]
        [string] $ArchiveName
    )
    $containerArchivePath = Join-Path $ContainerPath $ArchiveName;
    $containerPart = [string]::Join(":", @($ContainerName, $containerArchivePath));
    $archivePath = Join-Path $SourcesDirectory $ArchiveName;
    Compress-Archive -Path $SourcesDirectory"/*" -DestinationPath $archivePath;
    docker cp $archivePath $containerPart;
    Remove-Item -Path $archivePath -Force -ErrorAction Ignore;
}

function Update-LocalRepoWithContainerDev {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName,
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [string] $Filter = 'Modified=Yes'
    )
    $containerFilesPath = Invoke-CommandInWindowsContainer -ContainerName $ContainerName -ScriptBlock {
        $promptFile = "C:\Run\Prompt.ps1"
        if (Test-Path -Path $promptFile) {
            &"$($promptFile)" -silent;
        }
        
        $guid = [guid]::NewGuid();
        $filename = -join($guid, ".txt");
        $tempExportDirectory = Join-Path $env:TEMP $guid;
        $tempExportFilePath = Join-Path $tempExportDirectory $filename;
        if (-Not(Test-Path -Path $tempExportDirectory)) {
            New-Item -Path $tempExportDirectory -ItemType Directory | Out-Null;
        }
        
        Export-NAVApplicationObject -DatabaseName $args[0] -Filter $args[1] -Path $tempExportFilePath -Force -Confirm:$false | Out-Null;
        Set-NAVApplicationObjectProperty -TargetPath $tempExportFilePath -ModifiedProperty "No" -DateTimeProperty "";
        if(Test-Path -Path $tempExportFilePath) {
            Split-NAVApplicationObjectFile -Source $tempExportFilePath -Destination $tempExportDirectory -Force -Confirm:$false;
        }
        
        Remove-Item -Path $tempExportFilePath -Force -ErrorAction Ignore;
        
        Set-Location -Path $tempExportDirectory;
        $archivePath = Join-Path $tempExportDirectory "Objects.zip";
        Compress-Archive -Path "./*" -DestinationPath $archivePath;
        
        return $tempExportDirectory;
    } -ArgumentList $DatabaseName,$Filter

    Copy-ArchiveFromContainerThenExpandAndDelete -ContainerName $ContainerName -ContainerPath $containerFilesPath -LocalPath $SourcesDirectory -ArchiveName "Objects.zip";
    
    Invoke-CommandInWindowsContainer -ContainerName $ContainerName -ScriptBlock {
        Remove-Item -Path $args[0] -Recurse -Force -ErrorAction Ignore;
    } -ArgumentList $containerFilesPath;
}

function Update-ContainerDevWithLocalRepo {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName,
        [Parameter(Mandatory=$true)]
        [string] $DatabaseName,
        [string] $SourcesDirectory = "./src",
        [ValidateSet("Force","Yes","No")]
        [string] $SynchronizeSchemaChanges = "Force"
    )
    if (Test-Path -Path $SourcesDirectory"/*") {
        $archiveName = -join([guid]::NewGuid(), ".zip");
        $containerFilesPath = Invoke-CommandInWindowsContainer -ContainerName $ContainerName -ScriptBlock {
            $guid = [guid]::NewGuid();
            $tempPath = Join-Path $env:TEMP $guid;
            if (-Not(Test-Path -Path $tempPath)) {
                New-Item -Path $tempPath -ItemType Directory -Force -Confirm:$false;
            }
            return $tempPath;
        }
        if ($containerFilesPath.Length -gt 1) {
            $containerFiles = $containerFilesPath[0];
        }
        else {
            $containerFiles = $containerFilesPath;
        }
        Compress-ArchiveThenCopyToContainerAndDelete -ContainerName $ContainerName -ContainerPath $containerFiles -SourcesDirectory $SourcesDirectory -ArchiveName $archiveName;
        
        Invoke-CommandInWindowsContainer -ContainerName $ContainerName -ScriptBlock {
            $promptFile = "C:\Run\Prompt.ps1"
            if (Test-Path -Path $promptFile) {
                &"$($promptFile)" -silent;
            }

            $tempFilesPath, $archiveName, $databaseName, $syncSchema = $args;
            
            $archivePath = Join-Path $tempFilesPath $archiveName;
            Expand-Archive -Path $archivePath -DestinationPath $tempFilesPath;
            Remove-Item -Path $archivePath -Force -ErrorAction Ignore;
            
            $tempFileName = -join([guid]::NewGuid(), ".txt");
            $tempImportFilePath = Join-Path $tempFilesPath $tempFileName;
            Join-NAVApplicationObjectFile -Source $tempFilesPath"/*" -Destination $tempImportFilePath | Out-Null;
            Set-NAVApplicationObjectProperty -TargetPath $tempImportFilePath -ModifiedProperty "No" -DateTimeProperty "";        
            Import-NAVApplicationObject -Path $tempImportFilePath -DatabaseName $databaseName -SynchronizeSchemaChanges $syncSchema -Confirm:$false;
            Compile-NAVApplicationObject -DatabaseName $databaseName -SynchronizeSchemaChanges $syncSchema;
            
            Remove-Item -Path $tempFilesPath -Recurse -Force -ErrorAction Ignore;
        } -ArgumentList $containerFiles, $archiveName, $DatabaseName, $SynchronizeSchemaChanges
        
    }
    else {
        Write-Error "The remote repository has not been cloned properly. Make sure that the remote uri is valid and you have permissions to access the files";
    }
}

Export-ModuleMember -Function Update-LocalRepoWithContainerDev;
Export-ModuleMember -Function Update-ContainerDevWithLocalRepo;
