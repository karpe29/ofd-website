module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ssi: {
            options: {
                input: '',
                output: 'build/',
                matcher: '*.shtml'
            }
        },
        sass: {
            options: {
                implementation: require('sass'),
                sourceMap: true
            },
            dist: {
                files: {
                    'assets/css/custom.css': 'assets/sass/custom.scss'
                }
            }
        },
        jshint: {
            files: {
                src: ['assets/js/**/*.js']
            }
        },
        usemin: {
            html: ['build/*.html']
        },
        cssmin: {
            target: {
                files: {
                    // 'assets/css/libraries.css': ['assets/css/libraries/**/*.css'],
                    // 'assets/css/custom.css': ['assets/css/custom.css']
                }
            }
        },
        browserSync: {
            dev: {
                bsFiles: {
                    src: [
                        'assets/css/*.css',
                        './templates/**/*.shtml',
                        '*.html'
                    ]
                },
                options: {
                    watchTask: true,
                    proxy: "http://ofd.local/build/index.html",
                    open: true,
                    port: 3000
                }
            }
        },
        tinypng: {
            options: {
                apiKey: "7_yk9teC5pMwn3LgDIHp7gwG0RGeb0Z5",
                summarize: true
            },
            compress: {
                expand: true,
                src: 'assets/**/*.png',
                dest: './images/',
                ext: '.png'
            },
            compress2: {
                expand: true,
                src: 'assets/**/*.jpg',
                dest: './images/',
                ext: '.jpg'
            },
        },
        uglify: {
            options: {
                mangle: false,
                beautify: false,
                compress: false
            },
            my_target: {
                files: {
                    'assets/js/vendor.js': [
                        'assets/js/libraries/jquery.js',
                        'assets/js/libraries/modernizr.js',
                        'assets/js/libraries/jquery.validate.min.js',
                        'assets/js/libraries/bootstrap.min.js',
                        'assets/js/libraries/swiper.min.js',
                        'assets/js/libraries/skrollr.min.js',
                        'assets/js/libraries/instafeed.min.js',
                        'assets/js/libraries/isotope.pkgd.min.js',
                        'assets/js/libraries/masonry.min.js',
                        'assets/js/libraries/jquery.magnific-popup.min.js',
                        // 'assets/js/libraries/jquery.lazy.min.js',
                    ],
                    'build/assets/js/custom.js': 'build/assets/js/custom.js'
                }
            }
        },
        usemin: {
            html: ['build/*.html']
        },
        copy: {
            html: {
                expand: true,
                cwd: '',
                src: ['*.html'],
                dest: 'build/',

            },
            shtml: {
                files: [{
                    expand: true,
                    dot: true,
                    src: ['build/*.shtml'],
                    dest: [''],
                    rename: function(dest, src) {
                        return dest + src.replace(/\.shtml$/, ".html");
                    }
                }]
            },
            images: {
                expand: true,
                cwd: 'assets/images/',
                src: '**',
                dest: 'build/assets/images/'
            },
            fonts: {
                expand: true,
                cwd: 'assets/fonts/',
                src: '**',
                dest: 'build/assets/fonts/'

            },
            css: {
                expand: true,
                cwd: 'assets/css',
                src: '**/*.css',
                dest: 'build/assets/css/'

            },
            js: {
                expand: true,
                cwd: 'assets/js',
                src: '**/*.js',
                dest: 'build/assets/js/'
            },
            videos: {
                expand: true,
                cwd: 'assets/video',
                src: '**/*.mp4',
                dest: 'build/assets/video/'
            }
        },
        clean: {
            build: {
                src: ['build/*.shtml']
            }
        },
        watch: {
            grunt: { files: ['Gruntfile.js'] },
            sass: {
                files: ['assets/sass/**/*.scss'],
                tasks: ['sass', 'cssmin']
            },
            js: {
                files: ['assets/js/**/*.js'],
                tasks: ['uglify']
            }
        },
    });

    var ssi = require("ssi");

    grunt.loadNpmTasks('grunt-ssi');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-tinypng');
    grunt.loadNpmTasks('grunt-contrib-clean');


    grunt.registerTask('ssi', 'Flatten SSI includes in your HTML files.', function() {

        var ssi = require('ssi'),
            opts = this.options(),
            files = new ssi(opts.input, opts.output, opts.matcher);

        files.compile();

    });
    grunt.registerTask('default', ['browserSync', 'watch']);
    grunt.registerTask('build', ['sass', 'ssi', 'copy', 'usemin', 'cssmin', 'uglify', 'clean']);
}