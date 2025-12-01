add_executable(PlumeEditor WIN32 
    EditorMain.cpp
    SplashScreen.h
    SplashScreen.cpp
    resources.rc
)
target_link_libraries(PlumeEditor PRIVATE PlumeRuntime)

# Force Unicode
target_compile_definitions(PlumeEditor PRIVATE UNICODE _UNICODE)

# Add WebView2 support for Windows
if(WIN32)
    include(FetchContent)
    
    # Download WebView2 SDK via NuGet
    FetchContent_Declare(
        microsoft_web_webview2
        URL https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.2739.15
        DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    )
    FetchContent_MakeAvailable(microsoft_web_webview2)
    
    target_include_directories(PlumeEditor PRIVATE 
        ${microsoft_web_webview2_SOURCE_DIR}/build/native/include
    )
    
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(WEBVIEW2_ARCH "x64")
    else()
        set(WEBVIEW2_ARCH "x86")
    endif()
    
    target_link_libraries(PlumeEditor PRIVATE 
        ${microsoft_web_webview2_SOURCE_DIR}/build/native/${WEBVIEW2_ARCH}/WebView2LoaderStatic.lib
        gdiplus
        dwmapi
    )
endif()
