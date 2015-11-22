var gulp = require('gulp')
var del = require('del')
var clip = require('gulp-clip-empty-files')
var sourcemaps = require('gulp-sourcemaps')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var minifyCSS = require('gulp-minify-css')
var ngAnnotate = require('gulp-ng-annotate')
var templateCache = require('gulp-angular-templatecache')
var changed = require('gulp-changed')
var gulpif = require('gulp-if')
var server = require('gulp-server-livereload')
var typescript = require('gulp-typescript')
var merge = require('merge2')

var paths = {
    src: {
        base: './src/frontend',
        js: [
            './bower_components/lodash/lodash.js',
            './bower_components/angular/angular.js',
            './bower_components/angular-route/angular-route.js',
            './bower_components/angular-local-storage/dist/angular-local-storage.js',
            './bower_components/angular-recursion/angular-recursion.js',
            './bower_components/angular-sanitize/angular-sanitize.js',
            './src/frontend/app.js',
            './src/frontend/**/*.js'
        ],
        css: './src/frontend/**/*.css',
        html: [
            './src/frontend/**/*.html',
            '!./src/frontend/index.html'
        ],
        static_content: [
            './src/frontend/index.html',
            './src/frontend/favicon.ico',
            './src/frontend/images/**'
        ],
        backend: [
            './src/backend/**'
        ]
    },
    dist: {
        root: './build-frontend',
        bundleName: 'bundle.js',
        coverage: './coverage'
    },
    distBackend: {
        root: './build-backend',
    }
}

// clean up old build
gulp.task('clean', function clean(callback) {
    del([paths.dist.root, paths.distBackend.root, paths.dist.coverage], callback)
})

// copy over html
gulp.task('build-html', function() {
    gulp.src(paths.src.html)
        .pipe(clip())
        .pipe(templateCache({ module: 'chatty'}))
        .pipe(changed(paths.dist.root, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.dist.root))
})

// copy over html
gulp.task('build-static', function() {
    gulp.src(paths.src.static_content, { base: paths.src.base })
        .pipe(clip())
        .pipe(changed(paths.dist.root, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.dist.root))
})

// minify and concat all js
gulp.task('build-js', buildJs(false))
gulp.task('build-js-debug', buildJs(true))
function buildJs(debug) {
    return function() {
        var jspaths = paths.src.js
        gulp.src(jspaths)
            .pipe(clip())
            .pipe(gulpif(!debug, sourcemaps.init()))
            .pipe(ngAnnotate())
            .pipe(gulpif(!debug, uglify()))
            .pipe(concat(paths.dist.bundleName))
            .pipe(changed(paths.dist.root, {hasChanged: changed.compareSha1Digest}))
            .pipe(gulpif(!debug,sourcemaps.write('.')))
            .pipe(gulp.dest(paths.dist.root))
    }
}

// minify and concat all css
gulp.task('build-css', function() {
    gulp.src(paths.src.css)
        .pipe(clip())
        .pipe(minifyCSS())
        .pipe(concat('bundle.css'))
        .pipe(changed(paths.dist.root, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.dist.root))
})

// build the backend
var backendProject = typescript.createProject('tsconfig.json', {
    typescript: require('typescript')
})
gulp.task('build-backend', function() {
    var tsResult = backendProject.src().pipe(typescript(backendProject))
    return merge([tsResult.js, tsResult.dts])
        .pipe(changed(paths.distBackend.root, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.distBackend.root));
})

// rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.src.static_content, ['build-static'])
    gulp.watch(paths.src.html, ['build-html'])
    gulp.watch(paths.src.js, ['build-js-debug'])
    gulp.watch(paths.src.css, ['build-css'])
    gulp.watch(paths.src.backend, ['build-backend'])
})

gulp.task('server', function() {
    gulp.src(paths.dist.root)
        .pipe(server({
            port: 3000,
            livereload: true,
            directoryListing: false,
            open: true
        }))
})

gulp.task('default', ['server', 'watch', 'build-html', 'build-js-debug', 'build-css', 'build-static'])
gulp.task('build', ['build-html', 'build-js', 'build-css', 'build-static', 'build-backend'])
