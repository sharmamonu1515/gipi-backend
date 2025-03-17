'use strict';

const gulp = require('gulp');
const makeDir = require('mkdirp');
const dotenv = require('dotenv');
const logger = require('./utils/logger')(module);
const nodemon = require('gulp-nodemon');
const homedir = require('homedir');
const eslint = require('gulp-eslint');
const exec = require('child_process').exec;
const runSequence = require('run-sequence');
const browserSync = require('browser-sync');
const gulpLoadPlugins =  require('gulp-load-plugins');
const del = require('del');
const minifyejs = require('gulp-minify-ejs');
const pagespeed = require('psi').output;
const config    = require('./server/config').express;
const serverEnv = config.isOnProduction ? 'production' : 'development';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

/*
Build options
USAGE: gulp build -env prod
*/
const buildOption = process.argv[4];
let DEST_PATH;
if (buildOption) {
  switch (buildOption) {
    case 'prod':
      DEST_PATH = 'dist/public';
      break;
    default:
      DEST_PATH = 'client/public';
      break;
  }
  logger.info('Setting build destination to ', DEST_PATH);
} else {
  DEST_PATH = config.isOnProduction ? 'dist/public' : 'client/public';
}

const SOURCE_PATHS = {
    styles: [
      'client/sass/**/*.scss',
      'client/vendor/styles/**/*.css',
      //TODO: Disable old CSS if not needed
      'client/styles/**/*.css',
      ],
    scripts: [
      // list scripts here in the right order to be correctly concatenated
       'client/vendor/js/*.js',
       'client/js/*.js',
      ],
    images: 'client/images/**/*',
    views: 'views/**/*.ejs',
    filesToCopy: [
      'client/loaderio-59f5eec3f3df1b817bec122e1117860f.txt',
      'client/robots.txt',
      'client/favicon.ico',
      'client/sitemap.xml'
    ]
};
// Lint Javascript
gulp.task('lint', () => { gulp.src(['**/*.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
      });

// Optimize images
gulp.task('images', () =>
  gulp.src(SOURCE_PATHS.images)
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(`${DEST_PATH}/images`))
    .pipe($.size({title: 'images'}))
);

// Copy required public files to dist/public
gulp.task('copy', () =>
  gulp.src(SOURCE_PATHS.filesToCopy, {dot: true})
  .pipe(gulp.dest('dist/public'))
  .pipe($.size({title: 'copy'}))
);

gulp.task('sass', function() {
  return gulp.src('client/sass/**/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions).on('error',$.sass.logError))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(`${DEST_PATH}`))
})

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  const sassOptions = {
    outputStyle: 'expanded',
    errLogToConsole: true,
    precision: 10
  };

  return gulp.src(SOURCE_PATHS.styles)
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.uglifycss({"uglyComments": true, "maxLineLen": 80}))
    // TODO: Concatenate styles
    //.pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${DEST_PATH}/styles`))
    .pipe(gulp.dest('.tmp/styles'));
});

// Concatenate and minify JavaScript.
gulp.task('scripts', () =>
    gulp.src(SOURCE_PATHS.scripts)
      .pipe($.newer('.tmp/scripts'))
      .pipe($.sourcemaps.init())
      .pipe($.babel({
        ignore : [], //causing error after transpiled
        presets: ['env']
      }))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('.tmp/scripts'))
      // TODO: enable Concatenation
      //.pipe($.concat('main.min.js'))
      .pipe($.uglify({preserveComments: 'some'}))
      // Output files
      .pipe($.size({title: 'scripts'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(`${DEST_PATH}/js`))
      .pipe(gulp.dest('.tmp/scripts'))
);

// Minify EJS views
gulp.task('minify-ejs', () => {
  return gulp.src(SOURCE_PATHS.views)
    .pipe(minifyejs())
    //.pipe(rename({suffix:".min"}))
    .pipe(gulp.dest(`${DEST_PATH}/views/`))
});

// Clean dev output public directory
gulp.task('clean', () => del([
    //Files and directory to delete
    '.tmp',  'client/public/*'
    ], {dot: true}));

// Clean dist directory
gulp.task('clean-dist', () => del([
    //Files and directory to delete
    '.tmp', '!dist/.git', 'dist/*'
    ], {dot: true}));

// Setup environemnt app keys and mongodb datapath
gulp.task('setup-env', () => {
  var userHomeDir = homedir();
  var dbpath = `${userHomeDir}/data/db`;
     // Setup all the environments variables for the app
  dotenv.config({
    path: './.env-configs',
  });

  // Create mongo data directory
  makeDir(dbpath, (err) => {
    if (err) {
      logger.error('Error creating mongo data directory', err);
    } else {
      logger.info('db path created');
    }
  });
});

// Repair mongo
gulp.task('repair-mongo', ['setup-env'], () => {
   // start mongodb server
  exec('mongod --dbpath ~/data/db --repair', (err, stdout, stderr) => {
    if (err) logger.error(err); // return error
    // if (stderr) logger.error(stderr);
    logger.info(stdout);
    logger.error(stderr);
  });
});

// Initiate mongo db
gulp.task('init-mongo', ['setup-env'], () => {
   // start mongod service
  exec('mongod --dbpath /data/db --port 27017 --replSet "rs0"', (err, stdout) => {
    if (err) logger.error('Error starting mongodb', err);
    logger.info(stdout);
  });
});


// Watch files for changes & reload
gulp.task('watch', ['scripts', 'styles', 'images'], () => {
  gulp.watch(SOURCE_PATHS.styles, ['styles', reload]);
  gulp.watch(SOURCE_PATHS.scripts, ['scripts', reload]);
  gulp.watch(SOURCE_PATHS.images, ['images', reload]);
});

// Start server and watch for files
//init-mongo is replaced by init-connector(initializing mongo-connector), which requires init-mongo as requirement
gulp.task('serve', ['setup-env', 'init-mongoRepl', 'watch'], () => {
  logger.info(`Starting ${serverEnv} server... `);
  nodemon({
    script: './server/server.js',
    ext: 'ejs js html css scss',
    env: { NODE_ENV: serverEnv}
  });
});

// Start server and watch for files
gulp.task('debug', ['setup-env', 'init-mongoRepl','watch'], () => {
  logger.info(`Starting ${serverEnv} server... `);
  nodemon({
    script: './server/server.js',
    nodeArgs: ['--inspect'],
    ext: 'ejs js html css scss',
    env: { NODE_ENV: serverEnv}
  });
});

// Build all files, default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['lint',  'scripts', 'images', 'copy'],
    cb
  )
);

// Build all files, default task
gulp.task('build', cb =>
  runSequence(
    'styles',
    ['lint',  'scripts', 'images', 'copy'],
    cb
  )
);

//Initialize mongo-replica settings. Failing to do so will prevent reading and writing to the mongodb, and cause mongo-connector to refuse to start.
//In the future if data duplication becomes neccesary this will makes more sense, but for now we need the replica oplog for mongo-connector to function
gulp.task('init-mongoRepl',['init-mongo'], cb=>{
    setTimeout(f=>{
        //Initialize the mongodb as a single node replica
        exec("mongo --eval \"rs.initiate( {_id: 'rs0',  members: [{ _id: 0, host : 'localhost:27017'}]})\"", (err, stdout) => {
            logger.info("Initiating replicashards: \n",stdout);
            if (err) logger.error('Error allowing reading from secondary shards. This may prevent mongo from functioning.', err);
        });
        //Allow reading of this single node replica
        setTimeout(f=>{
            exec('mongo --eval "db.getMongo().setSlaveOk()"', (err, stdout) => {
                logger.info("Allowing Reading secondary shards: \n");
                if (err) logger.error('Error allowing reading from secondary shards. This may prevent mongo from functioning.', err);
                cb();
            });
        },1000);
    },1000);
});







