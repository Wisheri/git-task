var assert = require('assert');
var exec = require('child_process').exec;
var index = require('../index');
var fs = require('fs');
var path = require('path');

describe('empty-list', function() {
  before(function(done) {
    exec('git init', { cwd: path.resolve('.') }, function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      exec('git rev-parse --show-toplevel', { cwd: __dirname }, function(err, stdout, stderr) {
        if (err !== null) {
          throw new Error(stderr);
        }
        try {
          var dirPath = stdout.split('\n').join('').concat('/.git/hooks/git-task/');
          var files = fs.readdirSync(dirPath);
          for (var i = 0; i < files.length; i++) {
            var filePath = dirPath.concat(files[i]);
            if (fs.statSync(filePath).isFile())
              fs.unlinkSync(filePath);
          }

          done();
        } catch (e) {
          done();
        }
      });

    });
  });

  it('should return empty message', function(done) {
    exec('node index.js -l', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'No tasks defined for this branch. Feel free to commit\n');
      done();
    });
  });
});

describe('add a new task', function() {
  it('should add a new task', function(done) {
    exec('node index.js add "Task"', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'New task added: Task\n');
      index.getCurrentSituation(function(result) {
        assert.equal(1, result); // 1 task remaining.
        done();
      });
    });
  });
});

describe('Test git hook', function() {
  it('should not allow git commit', function(done) {
    this.timeout(0);
    exec('git commit', function(err, stdout, stderr) {
      assert.equal(stderr, 'You have 1 task remaining. Finish it before committing.\n');
      done();
    });
  });
});

describe('resolve a task', function() {
  it('Should return an error message', function(done) {
    exec('node index.js resolve hunter2', function(err, stdout, stderr) {
      assert.equal(stdout, 'Error: ID should be a number.\n');
      done();
    });
  });

  it('Should resolve a task', function(done) {
    exec('node index.js resolve 1', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      index.getCurrentSituation(function(result) {
        assert.equal(0, result); // 0 tasks remaining.
        done();
      });
    });
  });
});

describe('clean task file', function() {
  before(function(done) {
    exec('node index.js clean', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('Should return empty message', function(done) {
    exec('node index.js -l', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'No tasks defined for this branch. Feel free to commit\n');
      done();
    });
  });
});

describe('remove single task', function() {
  before(function(done) {
    exec('node index.js add "Task"', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('should remove task', function(done) {
    exec('node index.js remove 1', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'Task removed\n');
      done();
    });
  });

  it('should have removed the task', function(done) {
    exec('node index.js -l', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'No tasks defined for this branch. Feel free to commit\n');
      done();
    });
  });
});

describe('remove task file', function() {
  before(function(done) {
    exec('node index.js add "Task"', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('Should remove the task file', function(done) {
      assert.doesNotThrow(function() {
        index.removeTaskFile(function() {
          done();
        });
      });
  });
});

describe('move a task', function() {
  before(function(done) {
    exec('node index.js add "Task"', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('should move the task', function(done) {
    exec('node index.js move 1', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('should return an error message', function(done) {
    exec('node index.js move 2', function(err, stdout, stderr) {
      assert.equal(stdout, 'No such task exists.\n');
      done();
    });
  });

  it('should remove the task file', function(done) {
    exec('node index.js clean', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'All tasks removed.\n');
      done();
    });
  });

  it('should return an empty message', function(done) {
    exec('node index.js -l', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'No tasks defined for this branch. Feel free to commit\n');
      done();
    });
  });
});

describe('try to move a resolved task', function() {
  before(function(done) {
    exec('node index.js add "Task"', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }
      done();
    });
  });

  it('should resolve a task', function(done) {
    exec('node index.js resolve 1', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      index.getCurrentSituation(function(result) {
        assert.equal(0, result); // 0 tasks remaining.
        done();
      });
    });
  });

  it('should not allow to move a resolved task', function(done) {
    exec('node index.js move 1', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'Task already resolved\n');
      done();
    });
  });

  it('should remove the task file', function(done) {
    exec('node index.js clean', function(err, stdout, stderr) {
      if (err !== null) {
        throw new Error(stderr);
      }

      assert.equal(stdout, 'All tasks removed.\n');
      done();
    });
  });
});
