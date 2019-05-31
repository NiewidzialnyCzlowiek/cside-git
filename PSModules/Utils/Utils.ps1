function IsContainerRunning($ContainerName) {
    return docker inspect -f "{{.State.Running}}" $ContainerName;
}

function Get-ContainerId($ContainerName) {
    return docker ps --no-trunc -aqf "name=$($ContainerName)"
}

function Invoke-CommandInDirectory {
    param(
        [Parameter(Mandatory=$true)]
        [string] $Directory,
        [Parameter(Mandatory=$true)]
        [scriptblock] $ScriptBlock,
        [Object[]] $ArgumentList
    )
    $cwd = Get-Location;
    Set-Location -Path $Directory;
    $returnValue = Invoke-Command -ScriptBlock $ScriptBlock -Args $ArgumentList;
    Set-Location $cwd;
    return $returnValue;
}

function Invoke-CommandInWindowsContainer {
    param(
        [Parameter(Mandatory=$true)]
        [string] $ContainerName,
        [Parameter(Mandatory=$true)]
        [scriptblock] $ScriptBlock,
        [Object[]] $ArgumentList
    )
    $id = Get-ContainerId($ContainerName);
    $session = New-PSSession -ContainerId $id -RunAsAdministrator;
    $returnValue = Invoke-Command -Session $session -ScriptBlock $ScriptBlock -Args $ArgumentList;
    return $returnValue;
}

Export-ModuleMember -Function IsContainerRunning;
Export-ModuleMember -Function Get-ContainerId;
Export-ModuleMember -Function Invoke-CommandInDirectory;
Export-ModuleMember -Function Invoke-CommandInWindowsContainer;
