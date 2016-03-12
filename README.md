# webdriver-manager

### Setup

```
npm install
```

### Testing

```
gulp test
```

### Running webdriver
```
node built/lib/webdriver.js <command>
```

```
Usage:webdriver-manager <command> [options]

Commands:
  clean   removes all downloaded driver files from the out_dir
  start   start up the selenium server
  status   list the current available drivers
  update   install or update selected binaries

Options:
  --out_dir               Location to output/expect                          [default: /src/webdriver-manager/selenium]
  --seleniumPort          Optional port for the selenium standalone server
  --versions_standalone   Optional seleniuim standalone server version       [default: 2.52.0]
  --versions_chrome       Optional chrome driver version                     [default: 2.21]
  --ignore_ssl            Ignore SSL certificates
  --proxy                 Proxy to use for the install or update command
  --alternate_cnd         Alternate CDN to binaries
  --standalone            Install or update selenium standalone              [default: true]
  --chrome                Install or update chromedriver                     [default: true]
```

### Running a specific command

running update
```
node built/lib/cmds/update.js update-run
```

help update
```
node built/lib/cmds/update.js update-help
```

```
Usage:        update-run [options]
              update-help
Description:  install or update selected binaries

Options:
  --out_dir               Location to output/expect                        [default: /src/webdriver-manager/selenium]
  --ignore_ssl            Ignore SSL certificates
  --proxy                 Proxy to use for the install or update command
  --alternate_cnd         Alternate CDN to binaries
  --standalone            Install or update selenium standalone            [default: true]
  --chrome                Install or update chromedriver                   [default: true]
  --versions_standalone   Optional seleniuim standalone server version     [default: 2.52.0]
  --versions_chrome       Optional chrome driver version                   [default: 2.21]
  ```
