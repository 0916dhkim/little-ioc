# 🐜 little-ioc

An inversion-of-control library so small that you can read the entire source code in a sitting.

Inversion-of-control or dependency-injection shouldn't need complex code or any advanced language features.
`little-ioc` is a small utility class you can drop into your codebase
without changing how you've been writing code.

## 📦 Install

```
npm install @probablydanny/little-ioc
```

## 🚀 Usage

### Declare your container

```ts
import { Container } from "@probablydanny/little-ioc";

const container = new Container({
  // Simple value
  IEnvironmentVariables: {
    factory: () => ({
      DATABASE_URL: process.env.DATABASE_URL,
    }),
  },
  // Specify dependency of each factory function
  IDatabaseConnector: {
    factory: (deps: { env: Record<string, string> }) =>
      new Database(env.DATABASE_URL),
    dependsOn: { env: "IEnvironmentVariables" },
  },

  // Each factory function can have multiple dependencies (or none)
  IFoo: {
    factory: () => 42,
  },
  IBar: {
    factory: () => "Hello, World!",
  },
  IBaz: {
    factory: (deps: { foo: number; bar: string }) => `${foo} ${bar}`,
    dependsOn: { foo: "IFoo", bar: "IBar" },
  },
});
```

### Get a dependency from the container

```ts
const db = container.get("IDatabaseConnector");
```

### Inject dependencies into a function

```ts
const myFactory = (deps: { bar: string }) => () => {
  console.log(deps.bar);
};

const greet = container.inject({ bar: "IBar" })(myFactory);
greet(); // prints "Hello, World!"
```
