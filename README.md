# git-task

[![Build Status](https://travis-ci.org/Wisheri/git-task.svg?branch=master)](https://travis-ci.org/Wisheri/git-task)

Set and resolve tasks and prevent committing before everything is done. This is a command line tool for not forgetting to do the annoying little things before committing. Instead of keeping track of tasks for the entire project this tool allows you to set small tasks for one commit and branch at a time. After committing, the old resolved tasks are automatically removed and you can start creating new great things.

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

## Using Docker
You can also Docker for developing git-task.

Make sure you have [Docker](https://www.docker.com/) installed on your system.

Build the Docker image:  
`docker build -t your-image-name .`

Run the Docker image:  
`docker run -t -i your-image-name`


## License
[The MIT License (MIT)](https://github.com/Wisheri/git-task/blob/master/LICENSE.md)
