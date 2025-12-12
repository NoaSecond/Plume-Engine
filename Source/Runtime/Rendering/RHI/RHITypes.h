#pragma once
#include <cstdint>
#include <string>

namespace Plume {
namespace RHI {

    enum class GraphicsAPI {
        None = 0,
        Vulkan,
        DirectX12,
        OpenGL,
        Metal
    };

    enum class ShaderStage {
        Vertex,
        Fragment,
        Geometry,
        Compute
    };

    enum class PrimitiveTopology {
        TriangleList,
        TriangleStrip,
        LineList,
        PointList
    };

    enum class CullMode {
        None,
        Front,
        Back,
        FrontAndBack
    };

    enum class CompareOp {
        Never,
        Less,
        Equal,
        LessOrEqual,
        Greater,
        NotEqual,
        GreaterOrEqual,
        Always
    };

    struct Viewport {
        float x = 0.0f;
        float y = 0.0f;
        float width = 800.0f;
        float height = 600.0f;
        float minDepth = 0.0f;
        float maxDepth = 1.0f;
    };

    struct Scissor {
        int32_t x = 0;
        int32_t y = 0;
        uint32_t width = 800;
        uint32_t height = 600;
    };

} // namespace RHI
} // namespace Plume
