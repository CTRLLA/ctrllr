/**
 * configuration for grunt tasks
 * @module Gruntfile
 */

module.exports = function(grunt) {
  /** load tasks */
  require('load-grunt-tasks')(grunt);

  /** paths to file on server */
  var files = {

    /** meta / non-script files */
    meta: [
      'README.md',
      'TODO.md',
      'package.json',
      '.gitignore',
      '*.sublime-project',
      '*.sublime-workspace',
      '*.iml',
      '.idea',
      'dump.rdb',
    ],

    /** server scripts */
    server: [
      '*.*',
      'lib/*.*',
    ],

    /** array of all paths */
    all: []
  };

  /** add meta files to `files.all` */
  files.meta.forEach(function(file) {
    files.all.push(file);
  });

  /** add server files to `files.all` */
  files.server.forEach(function(file) {
    files.all.push(file);
  });

  /** ignore meta files on server */
  files.meta.forEach(function(file) {
    files.server.push('!' + file);
  });

  /** all grunt tasks */
  var tasks = {

    /** metadata inside `package.json` file */
    pkg: grunt.file.readJSON('package.json'),

    /** lint javascript tool */
    jshint: {

      /** paths to files */
      files: files.server,

      /** options for jshint task */
      options: {

        /** options here to override JSHint defaults */
        globals: {
          console: true,
          module: true
        }
      }
    },

    /** build TODO.md from inline comments */
    todos: {
      src: {
        /** options for plugin */
        options: {
          priorities: {
            low: /TODO/,
            med: /FIXME/,
            high: null
          },
          reporter: {
            /** put at the top of the generated file */
            header: function() {
              return '-- BEGIN TASK LIST --\n\n';
            },
            /** flow for each file */
            fileTasks: function(file, tasks, options) {
              /** skip if no tasks or checking Gruntfile */
              if (!tasks.length || file && file === 'Gruntfile.js') {
                return '';
              }

              var result = '* ' + file + ' (' + tasks.length + ')\n\n';

              /** iterate over tasks, add data */
              tasks.forEach(function(task) {
                result += '    [' + task.lineNumber + ' - ' +
                  task.priority + '] ' + task.line.trim() + '\n';

                result += '\n';
              });

              return result;
            },
            /** put at the bottom of the generated file */
            footer: function() {
              return '-- END TASK LIST --\n';
            }
          }
        },
        files: {
          'TODO.md': files.server
        }
      }
    },

    /** testing framework */
    jasmine_node: {
      options: {
        forceExit: true,
        match: 'spec',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec',
      },
      match: []
    },
  };

  /** merge files and task config, initialize grunt config */
  grunt.initConfig(grunt.util._.extend(tasks, files));

  /** default grunt task, ran with `grunt` */
  grunt.registerTask('default', [
    // ...
  ]);

  /** parses command, starts server or  runs either model, api, or single test(s) */
  grunt.registerTask('test', 'Used to run tests.', function(path) {
    var args = Array.prototype.slice.call(arguments);

    if (args.length) {
      grunt.config('jasmine_node.match', args[0] + '.');
    }

    grunt.task.run('jasmine_node');
  });

};