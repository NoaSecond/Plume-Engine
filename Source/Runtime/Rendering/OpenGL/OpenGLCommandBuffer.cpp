#ifdef PLUME_OPENGL_ENABLED

#include "OpenGLCommandBuffer.h"
#include "OpenGLDevice.h"
#include "OpenGLSwapChain.h"
#include <cmath>

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
        // Default clear color (black) - remove magenta debug clear
        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
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

    void OpenGLCommandBuffer::SetCamera(const Vec3& position, const Vec3& rotation, float fovOrSize, float aspect, bool orthographic) {
#ifdef _WIN32
        glMatrixMode(GL_PROJECTION);
        glLoadIdentity();
        
        if (orthographic) {
            float halfWidth = fovOrSize * aspect * 0.5f;
            float halfHeight = fovOrSize * 0.5f;
            glOrtho(-halfWidth, halfWidth, -halfHeight, halfHeight, -1000.0f, 1000.0f);
        } else {
            const float PI = 3.14159265f;
            float fovRad = fovOrSize * PI / 180.0f;
            float nearPlane = 0.1f;
            float farPlane = 1000.0f;
            float top = tanf(fovRad * 0.5f) * nearPlane;
            float right = top * aspect;
            glFrustum(-right, right, -top, top, nearPlane, farPlane);
        }
        
        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        
        glRotatef(-rotation.z, 0.0f, 0.0f, 1.0f); // roll
        glRotatef(-rotation.x, 1.0f, 0.0f, 0.0f); // pitch
        glRotatef(-rotation.y, 0.0f, 1.0f, 0.0f); // yaw
        glTranslatef(-position.x, -position.y, -position.z);
#endif
    }

    void OpenGLCommandBuffer::SetLight(int index, const Vec3& position, const Vec3& color) {
#ifdef _WIN32
        GLenum light = GL_LIGHT0 + index;
        GLfloat lightPos[] = { position.x, position.y, position.z, 1.0f };
        GLfloat lightDiff[] = { color.x, color.y, color.z, 1.0f };
        GLfloat lightAmb[] = { 0.2f, 0.2f, 0.2f, 1.0f };
        
        glLightfv(light, GL_POSITION, lightPos);
        glLightfv(light, GL_AMBIENT, lightAmb);
        glLightfv(light, GL_DIFFUSE, lightDiff);
#endif
    }

    void OpenGLCommandBuffer::DrawGrid(int size, float spacing) {
#ifdef _WIN32
        glEnable(GL_DEPTH_TEST);
        glDepthMask(GL_TRUE);
        glColor3f(0.5f, 0.5f, 0.5f);
        glBegin(GL_LINES);
        for (int i = -size; i <= size; i++) {
            glVertex3f(-size * spacing, 0.0f, i * spacing);
            glVertex3f(size * spacing, 0.0f, i * spacing);
            glVertex3f(i * spacing, 0.0f, -size * spacing);
            glVertex3f(i * spacing, 0.0f, size * spacing);
        }
        glEnd();
#endif
    }

    void OpenGLCommandBuffer::DrawGizmo() {
#ifdef _WIN32
        glLineWidth(3.0f);
        glBegin(GL_LINES);
        glColor3f(1.0f, 0.0f, 0.0f); glVertex3f(0.0f, 0.0f, 0.0f); glVertex3f(2.0f, 0.0f, 0.0f);
        glColor3f(0.0f, 1.0f, 0.0f); glVertex3f(0.0f, 0.0f, 0.0f); glVertex3f(0.0f, 2.0f, 0.0f);
        glColor3f(0.0f, 0.0f, 1.0f); glVertex3f(0.0f, 0.0f, 0.0f); glVertex3f(0.0f, 0.0f, 2.0f);
        glEnd();
        glLineWidth(1.0f);
#endif
    }

    void OpenGLCommandBuffer::DrawMeshPlaceholder(const TransformComponent& transform) {
#ifdef _WIN32
        glPushMatrix();
        glTranslatef(transform.Position.x, transform.Position.y, transform.Position.z);
        glRotatef(transform.Rotation.z, 0.0f, 0.0f, 1.0f);
        glRotatef(transform.Rotation.y, 0.0f, 1.0f, 0.0f);
        glRotatef(transform.Rotation.x, 1.0f, 0.0f, 0.0f);
        glScalef(transform.Scale.x, transform.Scale.y, transform.Scale.z);

        glColor3f(0.8f, 0.8f, 0.8f);
        glBegin(GL_QUADS);
        // Front
        glNormal3f(0.0f, 0.0f, 1.0f);
        glVertex3f(-1.0f, -1.0f, 1.0f); glVertex3f( 1.0f, -1.0f, 1.0f); glVertex3f( 1.0f,  1.0f, 1.0f); glVertex3f(-1.0f,  1.0f, 1.0f);
        // Back
        glNormal3f(0.0f, 0.0f, -1.0f);
        glVertex3f(-1.0f, -1.0f, -1.0f); glVertex3f(-1.0f,  1.0f, -1.0f); glVertex3f( 1.0f,  1.0f, -1.0f); glVertex3f( 1.0f, -1.0f, -1.0f);
        // Left
        glNormal3f(-1.0f, 0.0f, 0.0f);
        glVertex3f(-1.0f, -1.0f, -1.0f); glVertex3f(-1.0f, -1.0f,  1.0f); glVertex3f(-1.0f,  1.0f,  1.0f); glVertex3f(-1.0f,  1.0f, -1.0f);
        // Right
        glNormal3f(1.0f, 0.0f, 0.0f);
        glVertex3f( 1.0f, -1.0f, -1.0f); glVertex3f( 1.0f,  1.0f, -1.0f); glVertex3f( 1.0f,  1.0f,  1.0f); glVertex3f( 1.0f, -1.0f,  1.0f);
        // Top
        glNormal3f(0.0f, 1.0f, 0.0f);
        glVertex3f(-1.0f,  1.0f, -1.0f); glVertex3f(-1.0f,  1.0f,  1.0f); glVertex3f( 1.0f,  1.0f,  1.0f); glVertex3f( 1.0f,  1.0f, -1.0f);
        // Bottom
        glNormal3f(0.0f, -1.0f, 0.0f);
        glVertex3f(-1.0f, -1.0f, -1.0f); glVertex3f( 1.0f, -1.0f, -1.0f); glVertex3f( 1.0f, -1.0f,  1.0f); glVertex3f(-1.0f, -1.0f,  1.0f);
        glEnd();
        glPopMatrix();
#endif
    }

    void OpenGLCommandBuffer::SetDepthTest(bool enabled) {
#ifdef _WIN32
        if (enabled) glEnable(GL_DEPTH_TEST);
        else glDisable(GL_DEPTH_TEST);
#endif
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
