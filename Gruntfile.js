module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['*.js', 'git_hooks/**/*.js', 'test/**/*.js']
    },
    mochaTest: {
      test: {
        src: ['test/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
