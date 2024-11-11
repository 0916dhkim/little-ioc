export class Container<const TRegistry extends AnyRegistry> {
  #registry: TRegistry & ValidRegistry<TRegistry>;
  #cache: {
    [TKey in keyof TRegistry]?: InferDependency<TRegistry, TKey>;
  } = {};

  constructor(registry: TRegistry & ValidRegistry<TRegistry>) {
    this.#registry = registry;
  }

  /**
   * Get a dependency from the registry.
   */
  get<TKey extends keyof TRegistry>(
    key: TKey,
  ): InferDependency<TRegistry, TKey> {
    const cached = this.#cache[key];
    if (cached != null) {
      return cached;
    }

    const registryItem = this.#registry[key];
    if (registryItem == null) {
      throw new Error(`Missing dependency ${String(key)}`);
    }
    return registryItem.factory(this.resolveDependsOn(registryItem.dependsOn));
  }

  /**
   * Inject dependencies into a factory function.
   *
   * Useful for injecting dependencies into a factory outside of the registry.
   */
  inject<TDependsOn extends Record<string, keyof TRegistry>>(
    dependsOn: TDependsOn,
  ) {
    const deps = this.resolveDependsOn(dependsOn);
    return <
      TFactory extends (deps: ResolvedDependsOn<TRegistry, TDependsOn>) => any,
    >(
      factory: TFactory,
    ) => factory(deps);
  }

  private resolveDependsOn<TDependsOn extends Record<string, keyof TRegistry>>(
    dependsOn: TDependsOn | undefined,
  ): ResolvedDependsOn<TRegistry, TDependsOn> {
    return Object.fromEntries(
      Object.entries(dependsOn ?? {}).map(([dependsOnKey, registryKey]) => [
        dependsOnKey,
        this.get(registryKey as keyof TRegistry),
      ]),
    ) as ResolvedDependsOn<TRegistry, TDependsOn>;
  }
}

/** Widest type that can fit any registry type. */
type AnyRegistry = Record<
  string,
  {
    factory: (deps: any) => any;
    dependsOn?: any;
  }
>;

type InferDependency<
  TRegistry extends AnyRegistry,
  TKey extends keyof TRegistry,
> = ReturnType<TRegistry[TKey]["factory"]>;

type ResolvedDependsOn<
  TRegistry extends AnyRegistry,
  TDependsOn extends Record<string, keyof TRegistry> | undefined,
> = Prettify<{
  [TKey in keyof TDependsOn]: InferDependency<
    TRegistry,
    NonNullable<TDependsOn>[TKey]
  >;
}>;

/**
 * A narrower registry type to enforce rules:
 *
 * 1. The `dependsOn` object should only point to existing registry keys.
 * 2. The resolved dependencies from the `dependsOn` object should match the parameter of the `factory` function.
 */
type ValidRegistry<TRegistry extends AnyRegistry> = {
  [TKey in keyof TRegistry]: {
    factory: (
      deps: ResolvedDependsOn<TRegistry, TRegistry[TKey]["dependsOn"]>,
    ) => any;
    dependsOn?: Record<string, keyof TRegistry>;
  };
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
