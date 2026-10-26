@echo off
set RAIZ=%~dp0
if exist "%RAIZ%entorno.local.cmd" call "%RAIZ%entorno.local.cmd"
if not defined JAVA_HOME echo Falta JAVA_HOME (JDK 17). & exit /b 1
if not defined ANDROID_HOME echo Falta ANDROID_HOME (SDK de Android). & exit /b 1
pushd "%RAIZ%"
call node build.js || goto :error
call npx cap sync android || goto :error
popd
pushd "%RAIZ%android"
call "%RAIZ%android\gradlew.bat" assembleDebug --no-daemon -q || goto :error
popd
copy /y "%RAIZ%android\app\build\outputs\apk\debug\app-debug.apk" "%RAIZ%Reparto.apk" >nul
echo Listo: %RAIZ%Reparto.apk
exit /b 0
:error
popd
echo Ha fallado la generacion del APK.
exit /b 1
