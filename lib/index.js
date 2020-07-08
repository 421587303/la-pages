const { src, dest, parallel, series, watch } = require("gulp");

const del = require("del");
const browserSync = require("browser-sync");

const loadPligins = require("gulp-load-plugins");

const plugins = loadPligins();
const bs = browserSync.create();
const cwd = process.cwd();
let config = {
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      script: "assets/scripts/*.js",
      page: "*.html",
      image: "assets/images/**",
      font: "assets/fonts/**",
    },
  },
};

try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch (err) {}

function style() {
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.sass({ outputStyle: "expanded" }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
}

function script() {
  return src(config.build.paths.script, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
}

function page() {
  return src(config.build.paths.page, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
}

function image() {
  return src(config.build.paths.image, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
}

function font() {
  return src(config.build.paths.font, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
}
function extra() {
  return src("**", {
    base: config.build.public,
    cwd: config.build.public,
  }).pipe(dest(config.build.dist));
}

function clean() {
  return del([config.build.dist, config.build.temp]);
}

function serve() {
  watch(config.build.paths.styles, { cwd: config.build.src }, style);
  watch(config.build.paths.script, { cwd: config.build.src }, script);
  watch(config.build.paths.page, { cwd: config.build.src }, page);

  watch(
    [config.build.paths.image, config.build.paths.font],
    { cwd: config.build.src },
    bs.reload
  );

  watch("**", { cwd: config.build.public }, bs.reload);

  bs.init({
    notify: false,
    // files: "dist/**",
    port: 8001,
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: { "/node_modules": "node_modules" },
    },
  });
}

function useref() {
  return src(config.build.paths.page, {
    base: config.build.temp,
    cwd: config.build.temp,
  })
    .pipe(plugins.useref({ searchPath: [config.build.temp, "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    )
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(dest(config.build.dist));
}

const compile = parallel(style, script, page);
const build = series(
  clean,
  parallel(series(compile, useref), image, font, extra)
);
const devlop = series(compile, serve);

module.exports = {
  build,
  devlop,
};
