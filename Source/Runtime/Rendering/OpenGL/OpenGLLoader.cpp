#ifdef PLUME_OPENGL_ENABLED
#include "OpenGLLoader.h"
#include <iostream>

#ifdef _WIN32

PFNGLCREATESHADER PFN_glCreateShader = nullptr;
PFNGLSHADERSOURCEPROC PFN_glShaderSource = nullptr;
PFNGLCOMPILESHADERPROC PFN_glCompileShader = nullptr;
PFNGLGETSHADERIVPROC PFN_glGetShaderiv = nullptr;
PFNGLGETSHADERINFOLOGPROC PFN_glGetShaderInfoLog = nullptr;
PFNGLCREATEPROGRAMPROC PFN_glCreateProgram = nullptr;
PFNGLATTACHSHADERPROC PFN_glAttachShader = nullptr;
PFNGLLINKPROGRAMPROC PFN_glLinkProgram = nullptr;
PFNGLGETPROGRAMIVPROC PFN_glGetProgramiv = nullptr;
PFNGLGETPROGRAMINFOLOGPROC PFN_glGetProgramInfoLog = nullptr;
PFNGLUSEPROGRAMPROC PFN_glUseProgram = nullptr;
PFNGLDELETESHADERPROC PFN_glDeleteShader = nullptr;
PFNGLDELETEPROGRAMPROC PFN_glDeleteProgram = nullptr;
PFNGLGETUNIFORMLOCATIONPROC PFN_glGetUniformLocation = nullptr;
PFNGLUNIFORM1FPROC PFN_glUniform1f = nullptr;
PFNGLUNIFORM3FPROC PFN_glUniform3f = nullptr;

namespace Plume {
namespace RHI {

    bool LoadOpenGLExtensions() {
        PFN_glCreateShader = (PFNGLCREATESHADER)wglGetProcAddress("glCreateShader");
        PFN_glShaderSource = (PFNGLSHADERSOURCEPROC)wglGetProcAddress("glShaderSource");
        PFN_glCompileShader = (PFNGLCOMPILESHADERPROC)wglGetProcAddress("glCompileShader");
        PFN_glGetShaderiv = (PFNGLGETSHADERIVPROC)wglGetProcAddress("glGetShaderiv");
        PFN_glGetShaderInfoLog = (PFNGLGETSHADERINFOLOGPROC)wglGetProcAddress("glGetShaderInfoLog");
        PFN_glCreateProgram = (PFNGLCREATEPROGRAMPROC)wglGetProcAddress("glCreateProgram");
        PFN_glAttachShader = (PFNGLATTACHSHADERPROC)wglGetProcAddress("glAttachShader");
        PFN_glLinkProgram = (PFNGLLINKPROGRAMPROC)wglGetProcAddress("glLinkProgram");
        PFN_glGetProgramiv = (PFNGLGETPROGRAMIVPROC)wglGetProcAddress("glGetProgramiv");
        PFN_glGetProgramInfoLog = (PFNGLGETPROGRAMINFOLOGPROC)wglGetProcAddress("glGetProgramInfoLog");
        PFN_glUseProgram = (PFNGLUSEPROGRAMPROC)wglGetProcAddress("glUseProgram");
        PFN_glDeleteShader = (PFNGLDELETESHADERPROC)wglGetProcAddress("glDeleteShader");
        PFN_glDeleteProgram = (PFNGLDELETEPROGRAMPROC)wglGetProcAddress("glDeleteProgram");
        PFN_glGetUniformLocation = (PFNGLGETUNIFORMLOCATIONPROC)wglGetProcAddress("glGetUniformLocation");
        PFN_glUniform1f = (PFNGLUNIFORM1FPROC)wglGetProcAddress("glUniform1f");
        PFN_glUniform3f = (PFNGLUNIFORM3FPROC)wglGetProcAddress("glUniform3f");

        if (!PFN_glCreateShader || !PFN_glUseProgram) {
            // std::cerr << "Failed to load OpenGL extensions. Drivers might be too old." << std::endl;
            return false;
        }

        return true;
    }

}
}

#endif
#endif
