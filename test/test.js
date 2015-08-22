var assert = require('assert');
var exec = require('child_process').exec;
var index = require('../index');

describe('empty-list', function() {
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

describe('remove task file', function() {
  it('Should remove the task file', function(done) {
      assert.doesNotThrow(function() {
        index.removeTaskFile(function() {
          done();
        });
      });
  });
});
