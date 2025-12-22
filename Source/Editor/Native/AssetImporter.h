#pragma once
#include <string>
#include <filesystem>
#include <vector>
#include <vector>
#include "../ThirdParty/nlohmann_json.hpp"

namespace Plume {
    namespace fs = std::filesystem;
    using json = nlohmann::json;

class AssetImporter {
public:
    static bool ImportAsset(const fs::path& sourcePath, const fs::path& targetDir);

private:
    static bool ImportModel(const fs::path& sourcePath, const fs::path& targetDir);
    static void CreateAssetFile(const fs::path& path, const std::string& type, const json& meta, const char* data = nullptr, size_t size = 0);
};

}
