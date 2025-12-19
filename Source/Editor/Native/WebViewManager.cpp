#include "WebViewManager.h"
#include "EditorActionHandler.h"
#include <shlwapi.h>
#include <filesystem>
#include <fstream>
#include <vector>

namespace fs = std::filesystem;

// Global AppState pointer storage for the lambda callbacks which might be tricky to capture if not careful,
// but we CAN capture references in the lambda.
// However, the WebView2 callbacks are long-lived. We need to be sure AppState outlives them (it does, it's in main).

// We need to implement base64_decode from earlier if it was used in WebViewManager. 
// Checking EditorMain content... it was defined but not used in the shown `InitWebView` code? 
// No, I don't see `base64_decode` used in `InitWebView`.
// Wait, `InitWebView` uses `g_app` directly. We need to replace `g_app` with captured `appState`.

void WebViewManager::InitWebView(AppState& appState, const std::string& htmlPath) {
    // Capture address of appState. Be careful about lifetime.
    AppState* pApp = &appState; 

    CreateCoreWebView2Environment(
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [pApp, htmlPath](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                pApp->env = env;
                env->CreateCoreWebView2Controller(pApp->hwnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [pApp, htmlPath](HRESULT result, ICoreWebView2Controller* controller) -> HRESULT {
                            pApp->controller = controller;
                            controller->get_CoreWebView2(&pApp->webview);
                            
                            RECT client;
                            GetClientRect(pApp->hwnd, &client);
                            controller->put_Bounds(client);
                            
                            ComPtr<ICoreWebView2Settings> settings;
                            pApp->webview->get_Settings(&settings);
                            if (settings) {
                                settings->put_AreDefaultContextMenusEnabled(FALSE);
                                settings->put_IsStatusBarEnabled(FALSE);
                            }
                            
                            ComPtr<ICoreWebView2Controller3> controller3;
                            controller->QueryInterface(IID_PPV_ARGS(&controller3));
                            if (controller3) {
                                controller3->put_ShouldDetectMonitorScaleChanges(TRUE);
                            }

                            ComPtr<ICoreWebView2Controller2> controller2;
                            controller->QueryInterface(IID_PPV_ARGS(&controller2));
                            if (controller2) {
                                COREWEBVIEW2_COLOR transparentColor = {0, 0, 0, 0};
                                controller2->put_DefaultBackgroundColor(transparentColor);
                            }

                            controller->put_IsVisible(TRUE);

                            pApp->webview->AddWebResourceRequestedFilter(L"asset://*", COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);
                            pApp->webview->AddWebResourceRequestedFilter(L"https://plume-assets/*", COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);
                            pApp->webview->AddWebResourceRequestedFilter(L"http://plume-assets/*", COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);
                            
                            EventRegistrationToken token;
                            pApp->webview->add_WebResourceRequested(
                                Callback<ICoreWebView2WebResourceRequestedEventHandler>(
                                    [pApp](ICoreWebView2* sender, ICoreWebView2WebResourceRequestedEventArgs* args) -> HRESULT {
                                        ComPtr<ICoreWebView2WebResourceRequest> request;
                                        args->get_Request(&request);
                                        LPWSTR uri;
                                        request->get_Uri(&uri);
                                        std::wstring wuri(uri);
                                        CoTaskMemFree(uri);

                                        size_t schemePos = wuri.find(L"asset://");
                                        std::wstring relPathW;
                                        if (schemePos != std::wstring::npos) {
                                            relPathW = wuri.substr(schemePos + 8);
                                        } else {
                                            schemePos = wuri.find(L"http://plume-assets/");
                                            if (schemePos != std::wstring::npos) {
                                                relPathW = wuri.substr(schemePos + 20);
                                            } else {
                                                schemePos = wuri.find(L"https://plume-assets/");
                                                if (schemePos != std::wstring::npos) {
                                                    relPathW = wuri.substr(schemePos + 21);
                                                } else {
                                                    return S_OK;
                                                }
                                            }
                                        }
                                        int size = WideCharToMultiByte(CP_UTF8, 0, relPathW.c_str(), (int)relPathW.size(), NULL, 0, NULL, NULL);
                                        std::string relPath(size, 0);
                                        WideCharToMultiByte(CP_UTF8, 0, relPathW.c_str(), (int)relPathW.size(), relPath.data(), size, NULL, NULL);

                                        fs::path uiPath(pApp->uiFolder);
                                        fs::path binPath = uiPath.parent_path();
                                        fs::path filePath = binPath / relPath;

                                        if (!fs::exists(filePath)) {
                                            return S_OK;
                                        }

                                        std::ifstream file(filePath, std::ios::binary);
                                        if (!file.is_open()) return S_OK;

                                        std::vector<char> buffer((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
                                        file.close();

                                        if (buffer.empty()) return S_OK;

                                        std::string mimeType = "application/octet-stream";
                                        const char* dataStart = buffer.data();
                                        size_t dataSize = buffer.size();
                                        
                                        size_t scanLimit = (buffer.size() < 2048) ? buffer.size() : 2048;
                                        if (scanLimit > 4) {
                                            for(size_t i=0; i < scanLimit - 4; i++) {
                                                const unsigned char* p = (const unsigned char*)buffer.data() + i;
                                                if (p[0] == 0x89 && p[1] == 0x50 && p[2] == 0x4E && p[3] == 0x47) {
                                                    mimeType = "image/png";
                                                    dataStart = (const char*)p;
                                                    dataSize = buffer.size() - i;
                                                    break;
                                                }
                                                if (p[0] == 'R' && p[1] == 'I' && p[2] == 'F' && p[3] == 'F') {
                                                    mimeType = "audio/wav";
                                                    dataStart = (const char*)p;
                                                    dataSize = buffer.size() - i;
                                                    break;
                                                }
                                                if (p[0] == 'I' && p[1] == 'D' && p[2] == '3') {
                                                    mimeType = "audio/mpeg";
                                                    dataStart = (const char*)p;
                                                    dataSize = buffer.size() - i;
                                                    break;
                                                }
                                                if (p[0] == 0xFF && (p[1] & 0xE0) == 0xE0) {
                                                    mimeType = "audio/mpeg";
                                                    dataStart = (const char*)p;
                                                    dataSize = buffer.size() - i;
                                                    break;
                                                }
                                            }
                                        }

                                        IStream* stream = SHCreateMemStream((const BYTE*)dataStart, (UINT)dataSize);
                                        if (!stream) return S_OK;

                                        std::wstring headers = L"Content-Type: ";
                                        std::wstring wMime(mimeType.begin(), mimeType.end());
                                        headers += wMime;
                                        headers += L"\nAccess-Control-Allow-Origin: *";

                                        ComPtr<ICoreWebView2WebResourceResponse> response;
                                        if (pApp->env) {
                                            pApp->env->CreateWebResourceResponse(
                                                stream, 200, L"OK", (LPWSTR)headers.c_str(), &response
                                            );
                                            args->put_Response(response.Get());
                                        }
                                        
                                        stream->Release();
                                        return S_OK;
                                    }
                                ).Get(), &token);

                                if (pApp->webview) {
                                    LPWSTR script = L"(function(){\n"
                                        L"  try{\n"
                                        L"    document.documentElement.style.background='transparent';\n"
                                        L"    document.body.style.background='transparent';\n"
                                        L"    document.body.style.backgroundColor='transparent';\n"
                                        L"    document.documentElement.style.backgroundColor='transparent';\n"
                                        L"  }catch(e){}\n"
                                        L"  try{\n"
                                        L"    if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {\n"
                                        L"      window.chrome.webview.postMessage({ action: 'plume_dom_ready' });\n"
                                        L"      document.addEventListener('DOMContentLoaded', function(){ window.chrome.webview.postMessage({ action: 'plume_dom_ready' }); });\n"
                                        L"      setTimeout(function(){ window.chrome.webview.postMessage({ action: 'plume_dom_heartbeat' }); }, 750);\n"
                                        L"      setTimeout(function(){ window.chrome.webview.postMessage({ action: 'get-plugins' }); }, 1000);\n"
                                        L"    }\n"
                                        L"  }catch(e){}\n"
                                        L"})();";
                                    pApp->webview->ExecuteScript(script, nullptr);
                            }
                            
                            pApp->webview->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [pApp](ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                                        LPWSTR messageRaw = nullptr;
                                        args->get_WebMessageAsJson(&messageRaw);
                                        std::wstring messageW(messageRaw ? messageRaw : L"");
                                        if (messageRaw) CoTaskMemFree(messageRaw);

                                        int size = WideCharToMultiByte(CP_UTF8, 0, messageW.c_str(), (int)messageW.size(), NULL, 0, NULL, NULL);
                                        std::string msg(size, 0);
                                        WideCharToMultiByte(CP_UTF8, 0, messageW.c_str(), (int)messageW.size(), msg.data(), size, NULL, NULL);

                                        EditorActionHandler::HandleMessage(*pApp, msg);
                                        return S_OK;
                                    }
                                ).Get(), &token);

                            pApp->webview->Navigate(std::wstring(htmlPath.begin(), htmlPath.end()).c_str());
                            return S_OK;
                        }).Get());
                return S_OK;
            }).Get());
}
