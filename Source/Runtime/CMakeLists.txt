set(RUNTIME_SOURCES
    "Core/Engine.cpp"
    "Core/Engine.h"
    "Core/Scene.cpp"
    "Core/Scene.h"
    "Core/Components.h"
)

add_library(PlumeRuntime SHARED ${RUNTIME_SOURCES})
target_include_directories(PlumeRuntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

if(WIN32)
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_EXPORT)
endif()
