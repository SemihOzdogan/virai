#include "virai_safeareacontext.h"

#include <safeareacontext.h>

namespace facebook::react {

std::shared_ptr<TurboModule> virai_safeareacontext_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  return safeareacontext_ModuleProvider(moduleName, params);
}

} // namespace facebook::react
