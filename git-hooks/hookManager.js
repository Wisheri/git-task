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
};

function generateNewTaskFile(task, path) {
  var def = when.defer();

  var data = JSON.stringify(
    {
      "tasks": [
      {
        'id': 1,
        'task': task,
        'resolved': false,
        'move': false
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
    var taskId = data.tasks.length + 1;
    data.tasks.push({'id': taskId, 'task': task, 'resolved': false, 'move': false});

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
  var status;

  for (var i = 0; i < data.tasks.length; i++) {
    if (data.tasks[i].resolved === true || data.tasks[i].move === true) resolved++;
  }

  if (total === resolved) {
    status = '  ' + 'status: ' + 'All tasks are resolved. ' + 'Feel free to commit.'.green;
    console.log(status);

  } else {
    status = '  ' + 'status: ' + resolved.toString() + ' out of ' + total.toString() + ' tasks resolved.';
      console.log(status);
  }
}

function printAllTasks(filePath, branch) {
  readJSONFile(filePath).then(function(data) {
 
      if (data.tasks.length === 0) {
        console.log(config.noFileMsg);
 
      } else {
        console.log("Tasks for branch: " + branch);
        printStatus(data);
        console.log(config.indentation + "ID    TASK");
 
        for (var i = 0; i < data.tasks.length; i++) {
          var task = data.tasks[i];
          var spaces = new Array(Math.max(0, 7 - task.id.toString().length)).join(' ');
 
          if (task.resolved === true) {
            console.log(config.indentation + task.id.toString().green + spaces + task.task.green + ' (resolved)'.green);
 
          } else if (task.move === true) {
            console.log(config.indentation + task.id.toString().green + spaces + task.task.green + ' (moved)'.green);
 
          } else {
            console.log(config.indentation + task.id.toString().red + spaces + task.task.red + ' (unresolved)'.red);
          }
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
    fs.chmodSync(postHookPath, '755'); // Allow execution
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
      if (task.resolved === true || task.move === true) result--;
    }

    def.resolve(result);
  });

  return def.promise;
}

function emptyTasksWithMove(data, position) {
  if (position >= data.tasks.length) {
    return data;
  }

  if (data.tasks[position].move === false) {
    data.tasks.splice(position, 1);
    for (var i = position; i < data.tasks.length; i++) {
      data.tasks[i].id--;
    }

    return emptyTasksWithMove(data, position);

  } else {
    return emptyTasksWithMove(data, position + 1);
  }
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

  resolveTask: function(taskId, gitPath, branch) {
    if (isNaN(taskId)) {
      throw new Error('ID should be a number.');
    }
    var taskFilePath = getFilePath(gitPath, branch);

    if (!fs.existsSync(taskFilePath)) {
      console.log(config.noTaskMsg);

    } else {

      readJSONFile(taskFilePath).then(function(data) {
        if (taskId < 1 || taskId > data.tasks.length) {
          console.log(config.noTaskMsg);

        } else if (data.tasks[taskId - 1].resolved === true) {
          console.log("Task already resolved.".green);

        } else {
          data.tasks[taskId - 1].resolved = true;

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

  removeTask: function(taskId, gitPath, branch) {
    if (isNaN(taskId)) {
      throw new Error('ID should be a number.');
    }
    var taskFilePath = getFilePath(gitPath, branch);
    if (!fs.existsSync(taskFilePath)) {
      console.log(config.noTaskMsg);
    } else {
      readJSONFile(taskFilePath).then(function(data) {
        if (taskId < 1 || taskId > data.tasks.length) {
          console.log(config.noTaskMsg);
        } else {

          data.tasks.splice(taskId - 1, 1);
          for (var i = taskId - 1; i < data.tasks.length; i++) {
            data.tasks[i].id--;
          }

          writeFile(data, taskFilePath)
            .then(function() {
              console.log('Task removed'.green);
            });
        }
      });
    }
  },

  removeTaskFile: function(gitPath, branch, callback) {
    var taskFilePath = getFilePath(gitPath, branch);
    if (fs.existsSync(taskFilePath)) {

      readJSONFile(taskFilePath).then(function(data) {
        var singleMoved = false;

        for (var i = 0; i < data.tasks.length; i++) {
          if (data.tasks[i].move === true) {
            singleMoved = true;
            break;
          }
        }

        if (singleMoved === false) {
          fs.unlinkSync(taskFilePath);
          callback();
    
        } else {
          data = emptyTasksWithMove(data, 0);

          for (var j = 0; j < data.tasks.length; j++) {
            data.tasks[j].move = false;
          }

          writeFile(data, taskFilePath)
            .then(function() {
              callback();
            });
        }
      });

    } else {
      callback();
    }
  },

  moveTask: function(taskId, gitPath, branch) {
    if (isNaN(taskId)) {
      throw new Error('ID Should be a number.');
    }

    var taskFilePath = getFilePath(gitPath, branch);

    if (!fs.existsSync(taskFilePath)) {
      console.log(config.noTaskMsg);

    } else {
      readJSONFile(taskFilePath).then(function(data) {
        if (taskId < 1 || taskId > data.tasks.length) {
          console.log(config.noTaskMsg);

        } else {
          if (data.tasks[taskId -1].resolved === true) {
            console.log('Task already resolved');
            return;
          }
          data.tasks[taskId - 1].move = true;

          writeFile(data, taskFilePath)
            .then(function() {

              console.log('Task moved'.green);
            });
        }
      });
    }
  },

  cleanTasks: function(gitPath, branch, callback) {
    var taskFilePath = getFilePath(gitPath, branch);
    if (fs.existsSync(taskFilePath)) {
      fs.unlinkSync(taskFilePath);
    }

    callback();
  }
};
