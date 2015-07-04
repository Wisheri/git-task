# git-task
Set and resolve tasks and prevent committing before everything is done. This is a command line tool for not forgetting to do the annoying little things before committing.

## Usage

#### Add a new task
```
$ git task add "Run tests before committing"
New task added: Run tests before committing
```

#### List tasks
```
$ git task -l
Tasks for branch: refs/heads/new
  status: 0 out of 1 tasks resolved.
        ID    TASK
        1     Run tests before committing (unresolved)
```

#### Resolve a task
```
$ git task resolve 1
Tasks for branch: refs/heads/new
  status: All tasks are resolved. Feel free to commit.
        ID    TASK
        1     Run tests before committing (resolved)
```

#### Git Hooks
Git-task automatically sets git hooks, so it won't let you commit before every task has been resolved.
```
$ git commit
You have 1 task remaining. Finish it before committing.
```

## Install
`npm install -g git-task`

## License
[The MIT License (MIT)](https://github.com/Wisheri/git-task/blob/master/LICENSE.md)
