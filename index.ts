import { BuildConfig } from 'bun';
import * as fs from 'fs';
import * as path from 'path';
import renderPlugin from './renderPlugin';
// import postcss

type Route = {
  path: string;
  file: string;
};

Bun.spawnSync(["rm", "-rf"])

function discoverRoutes(directoryPath: string): Route[] {
  const routes: Route[] = [];

  function readRoutes(dirPath: string, parentPath = '') {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = `${dirPath}/${file}`;
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('[')) {
        const dirName = file;
        readRoutes(filePath, `${parentPath}/${dirName}`);
      } else if (file.match(/\.(tsx|jsx|mdx)$/)) {
        let routePath = parentPath ? `${parentPath}/${file}` : `/${file}`;
        routePath = routePath.replace(/\.(tsx|jsx|mdx)$/, '');

        if (file.match("index")){
          routePath = parentPath ? `${parentPath}/` : "/"
        }
        routes.push({ path: routePath, file: `${directoryPath}/${parentPath ? parentPath.replace("/", "")+"/": ""}${file}` });
      }
    });
  }

  readRoutes(directoryPath);
  return routes;
}

const routesDirectory = 'pages';
const routes: Route[] = discoverRoutes(routesDirectory);

console.log(routes);

// Build configuration
const p: string[] = []
routes.forEach( async (r)=>{
  p.push(r.file)
})


const buildConfig = {
  entrypoints: p,
  outdir: 'build',
  // minify: true,
  target: "browser",
  minify: true,
  publicPath:"_bite/static/",
  plugins: [renderPlugin],
  naming: {
    asset: "_bite/static/[dir]/assets/[name]-[hash].[ext]",
    chunk: "_bite/static/[dir]/chunks/[name]-[hash].[ext]",
    entry: "_bite/static/[dir]/[name]-[hash].[ext]"
  }
} as BuildConfig;

let output = await Bun.build(buildConfig)

if (!output.success){
  console.log(output.logs)
} else {
  output.outputs.forEach(async o=>{
    if (o.kind == "entry-point"){
      let filePath = o.path.split("_bite/static/")[1].split("-")[0]+".html";
      let tmplCont = await Bun.file("tmpl.html").text()
      let p = tmplCont.replaceAll("{{Script}}", o.path.replace(import.meta.dir+"/build/", "/"))
      Bun.write(`build/${filePath}`, p)
    }
  })
}

Bun.spawnSync(["cp", "-r public/* build/"])