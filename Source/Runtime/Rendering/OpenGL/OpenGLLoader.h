#pragma once

#ifdef PLUME_OPENGL_ENABLED

#ifdef _WIN32
#define NOMINMAX
#include <windows.h>
#include <gl/GL.h>

// Define necessary types if not available
typedef char GLchar;
typedef ptrdiff_t GLsizeiptr;
typedef ptrdiff_t GLintptr;

// Constants
#define GL_FRAGMENT_SHADER 0x8B30
#define GL_VERTEX_SHADER 0x8B31
#define GL_COMPILE_STATUS 0x8B81
#define GL_LINK_STATUS 0x8B82
#define GL_INFO_LOG_LENGTH 0x8B84
#define GL_ARRAY_BUFFER 0x8892
#define GL_STATIC_DRAW 0x88E4

// Function Pointers
typedef void (APIENTRY *PFNGLCREATESHADERPROC) (GLuint type);
typedef void (APIENTRY *PFNGLSHADERSOURCEPROC) (GLuint shader, GLsizei count, const GLchar *const*string, const GLint *length);
typedef void (APIENTRY *PFNGLCOMPILESHADERPROC) (GLuint shader);
typedef void (APIENTRY *PFNGLGETSHADERIVPROC) (GLuint shader, GLenum pname, GLint *params);
typedef void (APIENTRY *PFNGLGETSHADERINFOLOGPROC) (GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
typedef GLuint (APIENTRY *PFNGLCREATEPROGRAMPROC) (void);
typedef void (APIENTRY *PFNGLATTACHSHADERPROC) (GLuint program, GLuint shader);
typedef void (APIENTRY *PFNGLLINKPROGRAMPROC) (GLuint program);
typedef void (APIENTRY *PFNGLGETPROGRAMIVPROC) (GLuint program, GLenum pname, GLint *params);
typedef void (APIENTRY *PFNGLGETPROGRAMINFOLOGPROC) (GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog);
typedef void (APIENTRY *PFNGLUSEPROGRAMPROC) (GLuint program);
typedef void (APIENTRY *PFNGLDELETESHADERPROC) (GLuint shader);
typedef void (APIENTRY *PFNGLDELETEPROGRAMPROC) (GLuint program);
typedef GLint (APIENTRY *PFNGLGETUNIFORMLOCATIONPROC) (GLuint program, const GLchar *name);
typedef void (APIENTRY *PFNGLUNIFORM1FPROC) (GLint location, GLfloat v0);
typedef void (APIENTRY *PFNGLUNIFORM3FPROC) (GLint location, GLfloat v0, GLfloat v1, GLfloat v2);
typedef void (APIENTRY *PFNGLGENBUFFERSPROC) (GLsizei n, GLuint *buffers);
typedef void (APIENTRY *PFNGLBINDBUFFERPROC) (GLenum target, GLuint buffer);
typedef void (APIENTRY *PFNGLBUFFERDATAPROC) (GLenum target, GLsizeiptr size, const void *data, GLenum usage);
typedef void (APIENTRY *PFNGLENABLEVERTEXATTRIBARRAYPROC) (GLuint index);
typedef void (APIENTRY *PFNGLVERTEXATTRIBPOINTERPROC) (GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer);
typedef GLuint (APIENTRY *PFNGLCREATESHADER) (GLenum type);

// Externs
extern PFNGLCREATESHADER PFN_glCreateShader;
extern PFNGLSHADERSOURCEPROC PFN_glShaderSource;
extern PFNGLCOMPILESHADERPROC PFN_glCompileShader;
extern PFNGLGETSHADERIVPROC PFN_glGetShaderiv;
extern PFNGLGETSHADERINFOLOGPROC PFN_glGetShaderInfoLog;
extern PFNGLCREATEPROGRAMPROC PFN_glCreateProgram;
extern PFNGLATTACHSHADERPROC PFN_glAttachShader;
extern PFNGLLINKPROGRAMPROC PFN_glLinkProgram;
extern PFNGLGETPROGRAMIVPROC PFN_glGetProgramiv;
extern PFNGLGETPROGRAMINFOLOGPROC PFN_glGetProgramInfoLog;
extern PFNGLUSEPROGRAMPROC PFN_glUseProgram;
extern PFNGLDELETESHADERPROC PFN_glDeleteShader;
extern PFNGLDELETEPROGRAMPROC PFN_glDeleteProgram;
extern PFNGLGETUNIFORMLOCATIONPROC PFN_glGetUniformLocation;
extern PFNGLUNIFORM1FPROC PFN_glUniform1f;
extern PFNGLUNIFORM3FPROC PFN_glUniform3f;

// Wrapper macros
#define glCreateShader PFN_glCreateShader
#define glShaderSource PFN_glShaderSource
#define glCompileShader PFN_glCompileShader
#define glGetShaderiv PFN_glGetShaderiv
#define glGetShaderInfoLog PFN_glGetShaderInfoLog
#define glCreateProgram PFN_glCreateProgram
#define glAttachShader PFN_glAttachShader
#define glLinkProgram PFN_glLinkProgram
#define glGetProgramiv PFN_glGetProgramiv
#define glGetProgramInfoLog PFN_glGetProgramInfoLog
#define glUseProgram PFN_glUseProgram
#define glDeleteShader PFN_glDeleteShader
#define glDeleteProgram PFN_glDeleteProgram
#define glGetUniformLocation PFN_glGetUniformLocation
#define glUniform1f PFN_glUniform1f
#define glUniform3f PFN_glUniform3f

namespace Plume {
namespace RHI {
    bool LoadOpenGLExtensions();
}
}

#endif // _WIN32
#endif // PLUME_OPENGL_ENABLED
