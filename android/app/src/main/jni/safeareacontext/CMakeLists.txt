cmake_minimum_required(VERSION 3.13)

get_filename_component(
  SAFE_AREA_CONTEXT_ROOT
  "${CMAKE_CURRENT_LIST_DIR}/../../../../../../node_modules/react-native-safe-area-context"
  ABSOLUTE
)
set(SAFE_AREA_CONTEXT_CPP_DIR "${SAFE_AREA_CONTEXT_ROOT}/common/cpp")
set(SAFE_AREA_CONTEXT_JNI_DIR "${SAFE_AREA_CONTEXT_ROOT}/android/src/main/jni")
set(SAFE_AREA_CONTEXT_CODEGEN_DIR "${PROJECT_BUILD_DIR}/generated/source/codegen/jni")

target_include_directories(
  ${CMAKE_PROJECT_NAME}
  PRIVATE
  "${CMAKE_CURRENT_LIST_DIR}"
  "${SAFE_AREA_CONTEXT_CPP_DIR}"
  "${SAFE_AREA_CONTEXT_JNI_DIR}"
)

add_library(
  react_codegen_virai_safeareacontext
  OBJECT
  "${CMAKE_CURRENT_LIST_DIR}/safeareacontext-provider.cpp"
  "${SAFE_AREA_CONTEXT_CPP_DIR}/react/renderer/components/safeareacontext/RNCSafeAreaViewShadowNode.cpp"
  "${SAFE_AREA_CONTEXT_CPP_DIR}/react/renderer/components/safeareacontext/RNCSafeAreaViewState.cpp"
)

target_include_directories(
  react_codegen_virai_safeareacontext
  PUBLIC
  "${CMAKE_CURRENT_LIST_DIR}"
  "${SAFE_AREA_CONTEXT_CPP_DIR}"
  "${SAFE_AREA_CONTEXT_JNI_DIR}"
  "${SAFE_AREA_CONTEXT_CODEGEN_DIR}"
  "${SAFE_AREA_CONTEXT_CODEGEN_DIR}/react/renderer/components/safeareacontext"
)

target_link_libraries(
  react_codegen_virai_safeareacontext
  fbjni
  jsi
  reactnative
)

target_compile_reactnative_options(react_codegen_virai_safeareacontext PRIVATE)
