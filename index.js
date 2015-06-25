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
}

function addTask(task) {
  getLocalRepositoryPath()
    .then(openLocalRepository)
    .catch(handleError)
    .done(function(repository) {
      var path = repository.path();

      repository.getCurrentBranch().then(function(reference) {
        var branch = reference.name();
        hookManager.addNewTask(task.toString(), path, branch);
      });
    });
}

function resolveTask(task_id) {
  getLocalRepositoryPath()
    .then(openLocalRepository)
    .catch(handleError)
    .done(function(repository) {
      var path = repository.path();

      repository.getCurrentBranch().then(function(reference) {
        var branch = reference.name();
        hookManager.resolveTask(task_id, path, branch);
      });
    });
}

function resolveAllTasks() {
  getLocalRepositoryPath()
    .then(openLocalRepository)
    .catch(handleError)
    .done(function(repository) {
      var path = repository.path();

      repository.getCurrentBranch().then(function(reference) {
        var branch = reference.name();
        hookManager.resolveAllTasks(path, branch);
      });
    });
}

function listAllTasks() {
  getLocalRepositoryPath()
    .then(openLocalRepository)
    .catch(handleError)
    .done(function(repository) {
      var path = repository.path();

      repository.getCurrentBranch().then(function(reference) {
        var branch = reference.name();
        hookManager.listAllTasks(path, branch);
      });
    });
}

/*
* Application commands
*/

program
  .version(require('./package.json').version)
  .option('add [task]', 'Add a new task', addTask)
  .option('resolve <n>', 'Resolve a task', resolveTask)
  .option('-l, --list', 'List open tasks', listAllTasks)
  .parse(process.argv);
