@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\preinstall" %*
) ELSE (
  node  "%~dp0\preinstall" %*
)
