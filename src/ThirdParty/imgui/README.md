This folder holds a vendored copy of Dear ImGui (version: v1.92.4) used by the editor UI.

If you need to refresh or update the vendored copy, use the helper PowerShell script (the script was fixed to clone into the correct path):

  # from repository root (PowerShell)
  .\scripts\vendor_imgui.ps1 -Tag v1.92.4

After the files are present, configure CMake with:

```powershell
cmake -S . -B build -A x64 -DPLUME_ENABLE_IMGUI=ON
```

CMake prefers the local copy in `src/ThirdParty/imgui` over FetchContent. If you want to use the system/imgui from vcpkg instead, install the `imgui` port via vcpkg and omit the local folder.

Notes:
- The vendored header and source files are unmodified upstream files (except minor safety additions to ensure MSVC builds in this workspace). Keep the vendored version and the `Tag` in the vendor script in sync.
- If the vendor script fails, check that Git is available in PATH and that PowerShell has network access.
