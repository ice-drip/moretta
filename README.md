# @kaffee/moretta

A enhance linter util

## Support

* [x] eslint
* [x] vue-tsc
* [x] tsc
* [ ] stylelint
* [ ] prettier

## Installation

Install with npm

```bash
  npm install --dev @kaffee/moretta
```

Install with yarn

```bash
  yarn add --dev @kaffee/moretta
```

Install with pnpm

```bash
  pnpm add -D @kaffee/moretta
```

## Usage/Examples

Example command

```bash
yarn moretta
npx moretta
pnpm moretta
```

Example Config
```typescript
{
  // package manage: "npm"|"yarn"|"pnpm"
  "pm":"pnpm", 
  // eslint match file
  "eslint":"src/**/*.{vue,ts,tsx}", 
  // package script key 
  // package.json script: {"lint:tsc":"tsc --noEmit"}
  "tsc":"lint:tsc",
  // package script key 
  // package.json script: {"lint:vue-tsc":"vue-tsc --noEmit --skipLibCheck --pretty"}
  "vue-tsc":"lint:vue-tsc",
  // contributor map
  "contributor":{
    "rikka":"Muromi Rikka"
  }
}
```

## License

[GPL](https://choosealicense.com/licenses/gpl-3.0/)

## Contributors

<a href="https://github.com/Muromi-Rikka" >
  <img style="border-radius:200px;" src="https://github.com/Muromi-Rikka.png?size=50">
</a>
