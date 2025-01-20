export interface ModuleOptions {
  /**
   * The log level to use for the logger.
   *
   * 0: Fatal and Error
   * 1: Warnings
   * 2: Normal logs
   * 3: Informational logs
   * 4: Debug logs
   * 5: Trace logs
   *
   * More details at https://github.com/unjs/consola?tab=readme-ov-file#log-level
   * @default 3
   */
  logLevel: number
}
