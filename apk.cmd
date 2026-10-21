@echo off
rem Regenera Reparto.apk con la última versión de la app (src/ -> dist/ -> android/).
set JAVA_HOME=C:\herramientas\Android\jdk-17.0.20.1+1
set ANDROID_HOME=C:\herramientas\Android\sdk
set RAIZ=%~dp0
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
