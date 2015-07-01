#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var when = require('when');
var colors = require('colors');

var config = {
  preHookEnding: 'hooks/pre-commit',
  postHookEnding: 'hooks/post-commit',
  preScriptEnding: '/pre-commit',
  postScriptEnding: '/post-commit',
  dirEnding: 'hooks/git-task',
  noTaskMsg: 'No such task exists.'.red,
  noFileMsg: 'No tasks defined for this branch.' + ' Feel free to commit'.green,
  indentation: '        '
}

function generateNewTaskFile(task, path) {
  var def = when.defer();

  var data = JSON.stringify(
    {
      "tasks": [
      {
        'id': 1,
        'task': task,
        'resolved': false
      }]
    });

  fs.writeFile(path, data, function(err) {
    if (err) def.reject(err);
    def.resolve(JSON.parse(data));
  });

  return def.promise;
}

function readJSONFile(path) {
  var def = when.defer();

  fs.readFile(path, function(err, data) {
    if (err) def.reject(err);
    def.resolve(JSON.parse(data));
  });

  return def.promise;
}

function writeNewTask(task, path) {
  var def = when.defer();

  readJSONFile(path).then(function(data) {
    var task_id = data.tasks[data.tasks.length - 1]['id'] + 1;
    data.tasks.push({'id': task_id, 'task': task, 'resolved': false});

    fs.writeFile(path, JSON.stringify(data), function(err) {
      if (err) def.reject(err);
      def.resolve(data);
    });
  });

  return def.promise;
}

function printStatus(data) {
  var total = data.tasks.length;
  var resolved = 0;
  for (var i = 0; i < data.tasks.length; i++) {
    if (data.tasks[i].resolved === true) resolved++;
  }
  if (total === resolved) {
    var status = '  ' + 'status: ' + 'All tasks are resolved. ' + 'Feel free to commit.'.green;
    console.log(status);
  } else {
    var status = '  ' + 'status: ' + resolved.toString() + ' out of ' + total.toString() + ' tasks resolved.';
      console.log(status);
  }
}

function printAllTasks(filePath, branch) {
  readJSONFile(filePath).then(function(data) {
      console.log("Tasks for branch: " + branch)
      printStatus(data);
      console.log(config.indentation + "ID    TASK")
      for (var i = 0; i < data.tasks.length; i++) {
        var task = data.tasks[i];
        if (task.resolved === true) {
          console.log(config.indentation + task.id.toString().green + "     " + task.task.green + ' (resolved)'.green);
        } else {
          console.log(config.indentation + task.id.toString().red + "     " + task.task.red + ' (unresolved)'.red);
        }
      }
    });
}

function printSingleTask(data) {
  console.log("New task added: " + data.tasks[data.tasks.length - 1].task);
}

function getFilePath(gitPath, branch) {
  var preHookPath = gitPath.concat(config.preHookEnding);
  var postHookPath = gitPath.concat(config.postHookEnding);
  var preScriptPath = __dirname.concat(config.preScriptEnding);
  var postScriptPath = __dirname.concat(config.postScriptEnding);

  if (!fs.existsSync(preHookPath)) {
    // pre-commit
    fs.createReadStream(preScriptPath).pipe(fs.createWriteStream(preHookPath));
    fs.chmodSync(preHookPath, '755'); // Allow execution
  }
  if (!fs.existsSync(postHookPath)) {
    // post-commit
    fs.createReadStream(postScriptPath).pipe(fs.createWriteStream(postHookPath));
    fs.chmodSync(postHookPath, '755') // Allow execution
  }

  var dirPath = gitPath.concat(config.dirEnding);
  if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
  }

  var taskFilePath = dirPath + '/tasks-' + branch.replace(/[/\\*]/g, '-') + '.json';
  return taskFilePath;
}

function writeFile(data, path) {
  var def = when.defer();

  fs.writeFile(path, JSON.stringify(data), function(err) {
    if (err) def.reject(err);
    def.resolve(data);
  });

  return def.promise;
}

function calculateStatus(filePath, branch) {
  var def = when.defer();

  readJSONFile(filePath).then(function(data) {
    var result = data.tasks.length;
    for (var i = 0; i < data.tasks.length; i++) {
      var task = data.tasks[i];
      if (task.resolved === true) result--;
    }

    def.resolve(result);
  });

  return def.promise;
}

module.exports = {
  addNewTask: function(task, gitPath, branch) {
    var taskFilePath = getFilePath(gitPath, branch);

    if (fs.existsSync(taskFilePath)) {
      writeNewTask(task, taskFilePath)
        .then(printSingleTask);
    } else {
      generateNewTaskFile(task, taskFilePath)
        .then(printSingleTask);
    }
  },

  resolveTask: function(task_id, gitPath, branch) {
    var taskFilePath = getFilePath(gitPath, branch);

    if (!fs.existsSync(taskFilePath)) {
      console.log(config.noTaskMsg);
    } else {
      readJSONFile(taskFilePath).then(function(data) {
        if (task_id < 1 || task_id > data.tasks.length) {
          console.log(config.noTaskMsg);
        } else if (data.tasks[task_id - 1].resolved === true) {
          console.log("Task already resolved.".green);
        } else {
          data.tasks[task_id - 1].resolved = true;

          writeFile(data, taskFilePath)
            .then(printAllTasks(taskFilePath, branch));
        }
      });
    }
  },

  listAllTasks: function(gitPath, branch) {
    var taskFilePath = getFilePath(gitPath, branch);
    if (fs.existsSync(taskFilePath)) {
      printAllTasks(taskFilePath, branch);
    } else {
      console.log(config.noFileMsg);
    }
  },

  getStatus: function(gitPath, branch) {
    var def = when.defer();

    var taskFilePath = getFilePath(gitPath, branch);
    if (fs.existsSync(taskFilePath)) {
      calculateStatus(taskFilePath, branch).then(function(result) {
        def.resolve(result);
      });
    } else {
      def.reject(config.noFileMsg);
    }

    return def.promise;
  },

  removeTaskFile: function(gitPath, branch) {
    var taskFilePath = getFilePath(gitPath, branch);
    fs.unlinkSync(taskFilePath);
  }
}
