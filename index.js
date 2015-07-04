#!/usr/bin/env node

'use strict';

var git = require('nodegit');
var program = require('commander');
var exec = require('child_process').exec;
var path = require('path');
var when = require('when');
var colors = require('colors');
var hookManager = require('./git_hooks/hookManager');

function _command (command, callback) {
  exec(command, { cwd: '.' }, function (err, stdout, stderr) {
    callback(stdout.split('\n').join(''))
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

function openLocalRepository(path) {
  return git.Repository.open(path);
}

function handleError(error) {
  console.log(error);
  process.exit(1);
}

function getRepoInformation() {
  var def = when.defer();

  getLocalRepositoryPath()
    .then(openLocalRepository)
    .catch(handleError)
    .done(function(repository) {
      var path = repository.path();

      repository.getCurrentBranch().then(function(reference) {
        var branch = reference.name();
        var repoList = [path, branch];
        def.resolve(repoList);
      })
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
  });
}

function listAllTasks() {
  getRepoInformation().then(function(repoList) {
    hookManager.listAllTasks(repoList[0], repoList[1]);
  });
}

/*
* Application commands
*/

program
  .version(require('./package.json').version)
  .option('add [task]', 'Add a new task', addTask)
  .option('resolve <id>', 'Resolve a task', resolveTask)
  .option('-l, --list', 'List open tasks', listAllTasks)
  .parse(process.argv);

module.exports = {
  getCurrentSituation: function(callback) {
    getRepoInformation().then(function(repoList) {
      hookManager.getStatus(repoList[0], repoList[1]).then(function(result) {
        callback(result);
      });
    });
  },

  listRemaining: function(amount) {
    if (amount !== 1) {
      var return_str = "You have " + amount + " tasks remaining. Finish them before commiting."
    } else {
      var return_str = "You have " + amount + " task remaining. Finish it before commiting."
    }
    console.log(return_str.red);
  },

  removeTaskFile: function(callback) {
    getRepoInformation().then(function(repoList) {
       hookManager.removeTaskFile(repoList[0], repoList[1]);
    });
  }
}
