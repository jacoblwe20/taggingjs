###
# Simple Grunt File
#
# @link http://gruntjs.com/configuring-tasks
###
module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    # Some Basic Vars
    jsCore: ""
    jsCoreFile: "<%= jsCore %>tagging.js"
    jsCoreFileMin: "<%= jsCore %>tagging.min.js"

    # JSHint
    jshint:
      options:
        jshintrc: '.jshintrc'

      all: ['<%= jsCoreFile %>']

  # Loading Tasks
  grunt.loadNpmTasks 'grunt-contrib-jshint'

  grunt.registerTask 'default', [ 'jshint', ]