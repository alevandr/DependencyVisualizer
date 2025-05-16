#pragma once

#include "httplib.h"
#include "pch.h"

#include <windows.h>
#include <winrt/Windows.Foundation.Collections.h>

#include <shellapi.h>
#include <ShlObj.h>
#include <string>
#include <thread>
#include <json.hpp>

class WebServer
{
private:
    std::string FormatPath(const std::string path)
    {
        std::string formatedPath = path;
        boost::algorithm::replace_all(formatedPath, "\\", "/");
        return formatedPath;
    };

    void SaveCatalog(std::string catalogName)
    {
        // load cofing
        std::ifstream f("config.json");
        nlohmann::json config = nlohmann::json::parse(f);

        // change config
        config["catalog"] = catalogName;

        // save config
        std::ofstream o("config.json");
        o << std::setw(4) << config << std::endl;
    };

    void SaveGraph(httplib::Response* res)
    {
        wchar_t wchFileName[MAX_PATH] = { 0 };
        OPENFILENAME ofn;
        ZeroMemory(&ofn, sizeof(ofn));
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = NULL;
        ofn.lpstrFile = wchFileName;
        ofn.nMaxFile = sizeof(wchFileName);
        ofn.lpstrFilter = L"JSON Files (*.json)\0*.json\0\0";
        ofn.Flags = OFN_PATHMUSTEXIST | OFN_OVERWRITEPROMPT;
        ofn.lpstrDefExt = L"";

        if (GetSaveFileName(&ofn) == TRUE) {
			std::wstring wsFileName(wchFileName);
			std::string fileName(wsFileName.begin(), wsFileName.end());
            dc::Serializer serializer;
            serializer.serialize(currentDependencies, fileName);
            res->status = 200;
            res->set_content("Graph was successfully saved", "text/plain");
        }
        else 
        {
            //DWORD error = CommDlgExtendedError();
            res->status = 500;
            res->set_content("Graph was not saved", "text/plain");
        }
    }

    std::string ChooseFolder(httplib::Response* res)
    {
        char buffer[MAX_PATH] = { 0 };
        BROWSEINFOA browseInfo;
        ZeroMemory(&browseInfo, sizeof(browseInfo));

        browseInfo.lpszTitle = "Select Directory";
        browseInfo.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE;
        browseInfo.lpfn = nullptr;
        browseInfo.lParam = 0;
        browseInfo.hwndOwner = NULL;
        PIDLIST_ABSOLUTE pidl = SHBrowseForFolderA(&browseInfo);

        if (pidl != nullptr) {
            if (SHGetPathFromIDListA(pidl, buffer)) {
                if (browseInfo.hwndOwner)
                    BringWindowToTop(browseInfo.hwndOwner);
                CoTaskMemFree(pidl);
                auto dir = std::string(buffer);
                res->status = 200;
                return std::string(buffer);
            }
            CoTaskMemFree(pidl);
        }
        res->status = 500;
        return "";
    };

    std::string ChooseFile(httplib::Response* res)
    {
        wchar_t wchFileName[MAX_PATH] = { 0 };
        OPENFILENAME ofn;
        ZeroMemory(&ofn, sizeof(ofn));
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = NULL;
        ofn.lpstrFile = wchFileName;
        ofn.nMaxFile = sizeof(wchFileName);
        ofn.lpstrFilter = L"JSON Files (*.json)\0*.json\0\0";
        ofn.nFilterIndex = 1;
        ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;

        if (GetOpenFileName(&ofn) == TRUE) {
            std::wstring wsFileName = wchFileName;
            std::string fileName(wsFileName.begin(), wsFileName.end());
            res->status = 200;
            return fileName;
        }
        res->status = 500;
        return "";
    }

    std::string FileAsString(std::string fileName)
    {
        std::string content = "";
        std::ifstream file(fileName);
        string line;
        while (std::getline(file, line))
        {
            content += line;
        }
        return content;
    }

public:
    nlohmann::json config;
    map<dc::Node, vector<dc::Node>> currentDependencies;

    int start()
    {
        static httplib::Server svr;
        svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/index.html");
            });
        svr.Get("/favicon.ico", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/resources/graph.ico");
            });
        svr.Get("/index.css", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/index.css");
            });

        svr.Get("/d3.js", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/d3.js");
            });
        svr.Get("/index.js", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/index.js");
            });
        svr.Get("/Helper", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/Helper.js");
            });
        svr.Get("/Canvas", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/Canvas.js");
            });
        svr.Get("/Simulation", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/Simulation.js");
            });
        svr.Get("/State", [](const httplib::Request&, httplib::Response& res) {
            res.set_file_content("../../Webui/State.js");
            });

        svr.Get("/update-graph", [&](const httplib::Request& req, httplib::Response& res) {
            std::ifstream f("config.json");
            if (!f.fail())
            {
                this->config = nlohmann::json::parse(f);
            }
            vector<pair<string, vector<string>>> rawData = dc::Reader::getRawData(config["catalog"]); // <file_path, <raw includes>>
            currentDependencies = dc::Formater::formatData(rawData); // <Node, <Links_To_Other_Nodes>>
            dc::Serializer serializer;
            auto json = serializer.serialize(currentDependencies);
            res.set_content(json, "text");
            });
        svr.Get("/select-project-folder", [&](const httplib::Request& req, httplib::Response& res) {
            std::string folderPath = FormatPath(ChooseFolder(&res));
            SaveCatalog(folderPath);
            res.set_content(folderPath, "text/plain");
            });
        svr.Get("/save-graph", [&](const httplib::Request& req, httplib::Response& res) {
            SaveGraph(&res);
            });
        svr.Get("/get-graph-from-file", [&](const httplib::Request& req, httplib::Response& res) {
            std::string fileName = FormatPath(ChooseFile(&res));
            std::string json = FileAsString(fileName);
            res.set_content(json, "text");
            });

        svr.listen("127.0.0.1", 8080);
        return 0;
    };
    WebServer() 
    {
        winrt::init_apartment();
        std::ifstream f("config.json");
        if (!f.fail())
        {
            this->config = nlohmann::json::parse(f);
        }
    };
    ~WebServer() {};
};

#define IDM_EXIT 1000 // Define the ID for the Exit menu item
#define IDM_WEBVIEW 1001 // Define the ID for the Web view menu item
#define WM_TRAYICON (WM_USER + 1)

const wchar_t CLASS_NAME[] = L"TrayAppClass";
const wchar_t WINDOW_TITLE[] = L"Tray Application";
const int TRAY_ICON_ID = 1101;

void ShowContextMenu(HWND hwnd) {
    POINT pt;
    GetCursorPos(&pt);

    HMENU hMenu = CreatePopupMenu();
    AppendMenuW(hMenu, MF_STRING, IDM_WEBVIEW, L"Web view");
    AppendMenuW(hMenu, MF_STRING, IDM_EXIT, L"Exit");
    // Add more menu items as needed

    SetForegroundWindow(hwnd);
    TrackPopupMenu(hMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, pt.x, pt.y, 0, hwnd, nullptr);
    DestroyMenu(hMenu);
}

void AddTrayIcon(HWND hwnd, HINSTANCE hInstance) {
    NOTIFYICONDATA nid = {};
    nid.cbSize = sizeof(NOTIFYICONDATA);
    nid.hWnd = hwnd;
    nid.uID = TRAY_ICON_ID;
    nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    nid.uCallbackMessage = WM_TRAYICON;
    nid.hIcon = LoadIcon(hInstance, MAKEINTRESOURCE(IDI_APPLICATION));
    wcscpy_s(nid.szTip, L"Tray Application");
    Shell_NotifyIcon(NIM_ADD, &nid);
}

bool OpenURL(const std::wstring& url) {
    HINSTANCE result = ShellExecute(
        nullptr,
        L"open",
        url.c_str(),
        nullptr,
        nullptr,
        SW_SHOWNORMAL
    );

    return (reinterpret_cast<INT_PTR>(result) > 32);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
    case WM_CREATE:
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    case WM_TRAYICON:
        if (lParam == WM_RBUTTONUP) {
            ShowContextMenu(hwnd);
        }
        return 0;
    case WM_COMMAND: {
        int wmId = LOWORD(wParam);
        switch (wmId) {
        case IDM_EXIT:
            DestroyWindow(hwnd);
            break;
        case IDM_WEBVIEW:
            OpenURL(L"http://localhost:8080/");
            break;
        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
        }
        break;
    }
    default:
        return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
    return 0;
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
    // Register the window class
    WNDCLASSW wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;

    RegisterClassW(&wc);

    // Create the window (it can be invisible)
    HWND hwnd = CreateWindowExW(
        0,
        CLASS_NAME,
        WINDOW_TITLE,
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,
        nullptr,
        nullptr,
        hInstance,
        nullptr
    );

    if (hwnd == nullptr) {
        return 0;
    }

    // Hide the window
    ShowWindow(hwnd, SW_HIDE);

    // Add tray icon
    AddTrayIcon(hwnd, hInstance);

    // Message loopq
    MSG msg = {};
    WebServer server;
    std::thread t(&WebServer::start, &server);
    while (GetMessage(&msg, nullptr, 0, 0)) 
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    t.detach();
    return 0;
}
