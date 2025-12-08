#ifdef PLUME_OPENGL_ENABLED

#include "OpenGLCommandBuffer.h"
#include "OpenGLDevice.h"
#include "OpenGLSwapChain.h"

#ifdef _WIN32
#include <gl/GL.h>
#endif

namespace Plume {
namespace RHI {

    OpenGLCommandBuffer::OpenGLCommandBuffer(OpenGLDevice* device)
        : m_Device(device) {
    }

    OpenGLCommandBuffer::~OpenGLCommandBuffer() {
    }

    void OpenGLCommandBuffer::Begin() {
        // OpenGL is immediate mode, nothing to do
    }

    void OpenGLCommandBuffer::End() {
        // OpenGL is immediate mode, nothing to do
    }

    void OpenGLCommandBuffer::BeginRenderPass() {
        // Magenta clear color to make OpenGL rendering obvious
        glClearColor(1.0f, 0.0f, 1.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    }

    void OpenGLCommandBuffer::EndRenderPass() {
        // Nothing to do
    }

    void OpenGLCommandBuffer::SetViewport(const Viewport& viewport) {
        glViewport(
            static_cast<GLint>(viewport.x),
            static_cast<GLint>(viewport.y),
            static_cast<GLsizei>(viewport.width),
            static_cast<GLsizei>(viewport.height)
        );
        glDepthRange(viewport.minDepth, viewport.maxDepth);
    }

    void OpenGLCommandBuffer::SetScissor(const Scissor& scissor) {
        glScissor(scissor.x, scissor.y, scissor.width, scissor.height);
    }

    void OpenGLCommandBuffer::Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) {
        // TODO: Implement when we have vertex buffers
        // glDrawArrays(GL_TRIANGLES, firstVertex, vertexCount);
    }

    void OpenGLCommandBuffer::DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) {
        // TODO: Implement when we have index buffers
        // glDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, (void*)(firstIndex * sizeof(uint32_t)));
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
