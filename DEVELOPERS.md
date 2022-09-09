# How to use Arcade rom filter from source

This is simple enough,

```bash
git clone https://github.com/vasile-coste/arcade-rom-filter.git
cd arcade-rom-filter
npm i
npm run dev
```

others:
- `npm run css` - this will regenerate css on the go if you modify UI classes
- `npm run devs` - same as "npm run dev" only this one doesn\'t open the link in the browser



Note that you need [git](https://git-scm.com/downloads) and [NodeJS >= 16](https://nodejs.org/en/) for this.

# How to build Arcade rom filter

This is also simple,

```bash
git clone https://github.com/vasile-coste/arcade-rom-filter.git
cd arcade-rom-filter
npm i
npm run pkg-all
```
or if you want to build only for windows:
```bash
npm run pkg-win
```

stand alone command
```bash
npx pkg -t linux-x64,macos-x64,win-x64 -C GZip .
```