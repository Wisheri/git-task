#!/usr/bin/env node

'use strict';

var program = require('commander');
var exec = require('child_process').exec;
var path = require('path');
var when = require('when');
var colors = require('colors');
var hookManager = require('./git_hooks/hookManager');

function _command (command, callback) {
  exec(command, { cwd: '.' }, function (err, stdout, stderr) {
    callback(stdout.split('\n').join(''));
  });
}

function getLocalRepositoryPath() {
  var def = when.defer();

  _command('git rev-parse --show-toplevel', function (result) {
    if (result !== '') {
      def.resolve(result);
    } else {
      def.reject('Not a git repository');
    }
  });

  return def.promise;
}

function getCurrentBranch() {
  var def = when.defer();

  _command('git rev-parse --abbrev-ref HEAD', function (result) {
    if (result !== '')
      def.resolve(result);
    else
      def.reject('Could not fetch current git branch.');
  });

  return def.promise;
}

function handleError(error) {
  console.log(error.toString().red);
  process.exit(0);
}

function getRepoInformation() {
  var def = when.defer();

  getLocalRepositoryPath()
    .catch(handleError)
    .done(function(path) {
      getCurrentBranch().then(function(branch) {
        var repoList = [path.concat('/.git/'), branch];
        def.resolve(repoList);
      })
      .catch(handleError);
    });

  return def.promise;
}

function addTask(task) {
  getRepoInformation().then(function(repoList) {
    hookManager.addNewTask(task.toString(), repoList[0], repoList[1]);
  });
}

function resolveTask(task_id) {
  getRepoInformation().then(function(repoList) {
    hookManager.resolveTask(task_id, repoList[0], repoList[1]);
  })
  .catch(handleError);
}

function listAllTasks() {
  getRepoInformation().then(function(repoList) {
    hookManager.listAllTasks(repoList[0], repoList[1]);
  });
}

function cleanTasks() {
  getRepoInformation().then(function(repoList) {
    hookManager.removeTaskFile(repoList[0], repoList[1], function() {
      console.log('All tasks removed.'.green);
    });
  });
}

/*
* Application commands
*/

program
  .version(require('./package.json').version)
  .usage('[option] [value]')
  .option('add [task]', 'Add a new task', addTask)
  .option('resolve <id>', 'Resolve a task', resolveTask)
  .option('clean', 'Clean tasks', cleanTasks)
  .option('-l, --list', 'List open tasks', listAllTasks);

program.on('--help', function() {
  console.log(' Description:');
  console.log('');
  console.log('    Set and resolve tasks within one git commit. You will not be able to commit before resolving every task that has been set.');
  console.log('');
  console.log(' Examples:');
  console.log('');
  console.log('    $ git task add "Remove debug prints" (Add a new task)');
  console.log('');
  console.log('    $ git task -l (List tasks)');
  console.log('');
  console.log('    $ git task resolve 1 (Resolve the task with ID 1)');
  console.log('');
  console.log('    $ git task clean (Remove all tasks)');
  console.log('');
});

program.parse(process.argv);

module.exports = {
  getCurrentSituation: function(callback) {
    getRepoInformation().then(function(repoList) {
      hookManager.getStatus(repoList[0], repoList[1]).then(function(result) {
        callback(result);
      })
      .catch(function(error) {
        process.exit(0);
      });
    });
  },

  listRemaining: function(amount) {
    var returnStr;
    if (amount !== 1) {
      returnStr = "You have " + amount + " tasks remaining. Finish them before committing.";
    } else {
      returnStr = "You have " + amount + " task remaining. Finish it before committing.";
    }
    console.log(returnStr.red);
  },

  removeTaskFile: function(callback) {
    getRepoInformation().then(function(repoList) {
       hookManager.removeTaskFile(repoList[0], repoList[1], function() {
        callback();
       });
    });
  }
};
