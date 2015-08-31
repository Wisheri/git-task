var assert = require('assert');
var exec = require('child_process').exec;
var index = require('../index');
var fs = require('fs');

describe('empty-list', function() {
  before(function(done) {
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
